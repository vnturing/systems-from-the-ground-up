#!/usr/bin/env python3
"""Compile and exercise course artifacts. Python standard library; C17 + POSIX compiler."""
import argparse
import os
from pathlib import Path
import selectors
import shlex
import socket
import struct
import subprocess
import sys
import traceback

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / '.build'
LABS = ROOT / 'labs'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--lab', choices=[str(i) for i in range(1, 9)], action='append', help='repeat to select labs; default: all')
parser.add_argument('--loopback', action='store_true', help='also test the real TCP listener; requires permission to bind loopback')
parser.add_argument('--sanitize', action='store_true', help='ASan + UBSan; also exercise the deliberately broken bounds example')
args = parser.parse_args()
BUILD.mkdir(exist_ok=True)
CC = shlex.split(os.environ.get('CC', 'cc'))
FLAGS = ['-std=c17', '-D_POSIX_C_SOURCE=200809L', '-Wall', '-Wextra', '-Wpedantic', '-Werror', '-g', '-O1' if args.sanitize else '-O2']
if args.sanitize:
    FLAGS += ['-fsanitize=address,undefined', '-fno-omit-frame-pointer']

def run(command, *, data=None, expected=0, timeout=20):
    result = subprocess.run([str(x) for x in command], input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout, cwd=ROOT)
    if result.returncode != expected:
        raise AssertionError(f'{command}: exit {result.returncode}, expected {expected}\n{result.stdout.decode(errors="replace")}\n{result.stderr.decode(errors="replace")}')
    return result

def compile_program(name, files, extra=()):
    target = BUILD / (name + ('-san' if args.sanitize else ''))
    run(CC + FLAGS + list(extra) + [LABS / f for f in files] + ['-o', target])
    return target

def lab1():
    exe = compile_program('inspect', ['01-artifacts/inspect.c'])
    assert b'checked multiplication: ok' in run([exe]).stdout
    for flag, suffix in [('-E', '.i'), ('-S', '.s'), ('-c', '.o')]:
        run(CC + FLAGS + [flag, LABS/'01-artifacts/inspect.c', '-o', BUILD/('inspect'+suffix)])

def lab2():
    exe = compile_program('machine', ['02-machine/main.c', '02-machine/compute.c'])
    assert b'sum=14 signed=-1 unsigned=1' in run([exe]).stdout
    obj = BUILD/'main-only.o'
    run(CC + FLAGS + ['-c', LABS/'02-machine/main.c', '-o', obj])
    failed = subprocess.run(CC + FLAGS + [str(obj), '-o', str(BUILD/'must-not-link')], capture_output=True)
    assert failed.returncode != 0 and b'sum_words' in failed.stderr, 'missing-definition demonstration must fail at link'
    if args.sanitize:
        bug = compile_program('bounds-bug', ['02-machine/bounds-bug.c'])
        result = subprocess.run([str(bug), '4'], capture_output=True, timeout=10)
        assert result.returncode != 0 and b'AddressSanitizer' in result.stderr, 'expected ASan bounds diagnostic'

def lab3():
    exe = compile_program('matrix', ['03-locality/matrix.c'])
    for n in [1, 17, 257]:
        output = run([exe, str(n)]).stdout.decode()
        expected = sum(i % 97 for i in range(n*n))
        assert f'checksum={expected}' in output
    run([exe, '0'], expected=2)

def lab4():
    exe = compile_program('arena', ['04-arena/arena.c', '04-arena/check.c'])
    assert b'overflow, failure state, reset ok' in run([exe]).stdout

def lab5():
    exe = compile_program('pipeline', ['05-pipeline/pipeline.c'])
    for _ in range(3):
        assert run([exe], timeout=5).stdout == b'SYSTEMS NEED EVIDENCE\n'

def lab6():
    fault = compile_program('io-injection', ['06-io/io-test.c'])
    assert b'actual helper passed' in run([fault]).stdout
    exe = compile_program('copy', ['06-io/copy.c', '06-io/io.c'])
    for data in [b'', b'\x00', bytes(range(256))*1357]:
        assert run([exe], data=data).stdout == data
    r, w = os.pipe()
    os.close(r)
    try:
        child = subprocess.Popen([str(exe)], stdin=subprocess.PIPE, stdout=w, stderr=subprocess.PIPE)
    finally:
        os.close(w)
    _, error = child.communicate(b'closed reader', timeout=5)
    assert child.returncode == 1 and b'write' in error, 'EPIPE should be reported, not silently accepted'

def recv_exact(sock, size):
    data = bytearray()
    while len(data) < size:
        chunk = sock.recv(size-len(data))
        if not chunk:
            raise AssertionError('unexpected EOF from reference server')
        data.extend(chunk)
    return bytes(data)

def frame(payload):
    return struct.pack('!I', len(payload)) + payload

def lab7():
    exe = compile_program('server', ['07-frames/server.c', '06-io/io.c'])
    cases = []
    for payload in [b'', b'cat', bytes(range(256)), b'z'*4096]:
        cases.append(([frame(payload)], [payload.upper()]))
    combined = frame(b'one') + frame(b'') + frame(b'two')
    cases.append(([combined], [b'ONE', b'', b'TWO']))
    message = frame(b'fragment')
    for split in range(1, len(message)):
        cases.append(([message[:split], message[split:]], [b'FRAGMENT']))
    # Include bytes sent individually, which still must not be assumed to arrive individually.
    cases.append(([bytes([b]) for b in message], [b'FRAGMENT']))
    bad_cases = [struct.pack('!I', 4097), b'\x00\x00', frame(b'abcd')[:-1]]
    # Exercise the real compiled handler over inherited connected sockets without requiring bind privileges.
    all_errors = b''
    for chunks, responses in cases:
        peer, endpoint = socket.socketpair()
        child = subprocess.Popen([str(exe), '--connected-fd', str(endpoint.fileno())],
                                 pass_fds=(endpoint.fileno(),), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        endpoint.close()
        try:
            peer.settimeout(5)
            for chunk in chunks:
                peer.sendall(chunk)
            for expected in responses:
                length = struct.unpack('!I', recv_exact(peer, 4))[0]
                assert length == len(expected)
                assert recv_exact(peer, length) == expected
            peer.shutdown(socket.SHUT_WR)
            assert peer.recv(1) == b''
            _, error = child.communicate(timeout=5)
            assert child.returncode == 0, error.decode(errors='replace')
        finally:
            peer.close()
            if child.poll() is None:
                child.kill(); child.communicate()
    for malformed in bad_cases:
        peer, endpoint = socket.socketpair()
        child = subprocess.Popen([str(exe), '--connected-fd', str(endpoint.fileno())],
                                 pass_fds=(endpoint.fileno(),), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        endpoint.close()
        try:
            peer.settimeout(5)
            peer.sendall(malformed)
            peer.shutdown(socket.SHUT_WR)
            try:
                assert peer.recv(1) == b''
            except ConnectionResetError:
                pass
            _, error = child.communicate(timeout=5)
            assert child.returncode == 0, error.decode(errors='replace')
            all_errors += error
        finally:
            peer.close()
            if child.poll() is None:
                child.kill(); child.communicate()
    assert b'oversized' in all_errors and b'incomplete header' in all_errors and b'incomplete body' in all_errors
    print('  Protocol handler: actual connected sockets; all single splits, empty/max/binary/coalesced/rejected frames', flush=True)
    if not args.loopback:
        print('  TCP listener not exercised; add --loopback where local bind is permitted.', flush=True)
        return
    server = subprocess.Popen([str(exe), str(len(cases)+len(bad_cases))], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        selector = selectors.DefaultSelector()
        selector.register(server.stdout, selectors.EVENT_READ)
        assert selector.select(5), 'server did not announce a port'
        line = server.stdout.readline().decode().strip()
        selector.close()
        assert line.startswith('PORT='), server.stderr.read().decode(errors='replace') if server.poll() is not None else line
        port = int(line[5:])
        for chunks, responses in cases:
            with socket.create_connection(('127.0.0.1', port), timeout=5) as sock:
                sock.settimeout(5)
                for chunk in chunks:
                    sock.sendall(chunk)
                for expected in responses:
                    length = struct.unpack('!I', recv_exact(sock, 4))[0]
                    assert length == len(expected)
                    assert recv_exact(sock, length) == expected
                sock.shutdown(socket.SHUT_WR)
                assert sock.recv(1) == b''
        for malformed in bad_cases:
            with socket.create_connection(('127.0.0.1', port), timeout=5) as sock:
                sock.settimeout(5)
                sock.sendall(malformed)
                sock.shutdown(socket.SHUT_WR)
                try:
                    assert sock.recv(1) == b'', 'malformed frame must not produce a successful response'
                except ConnectionResetError:
                    pass  # Closing with unread bytes may reset a stream on some OSes.
        _, error = server.communicate(timeout=5)
        assert server.returncode == 0, error.decode(errors='replace')
        assert b'oversized' in error and b'incomplete header' in error and b'incomplete body' in error
    finally:
        if server.poll() is None:
            server.kill()
            server.communicate()

def lab8():
    for capacity in [1, 8]:
        exe = compile_program('queue'+str(capacity), ['08-queue/queue.c'], ['-pthread', f'-DQUEUE_CAPACITY={capacity}'])
        for workers in [1, 2, 7]:
            for _ in range(2):
                assert b'10000 unique items' in run([exe, str(workers)], timeout=15).stdout

selected = args.lab or [str(i) for i in range(1, 9)]
try:
    for number in selected:
        globals()['lab'+number]()
        print(f'PASS Lab {int(number):02d}', flush=True)
except (AssertionError, OSError, subprocess.SubprocessError) as error:
    traceback.print_exc()
    print(f'FAIL: {error}', file=sys.stderr)
    sys.exit(1)
print('All selected lab checks passed. Timing outcomes are observations, not speed assertions.')
