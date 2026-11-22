{"title":"Artifact and debugger field guide","slug":"tools","subtitle":"Choose a tool for the boundary you are investigating."}
---
## Build and inspect
| Question | Linux / common compiler command |
| --- | --- |
| What did preprocessing produce? | cc -E file.c -o file.i |
| What assembly was generated? | cc -S -O2 file.c -o file.s |
| Can source become an object without linking? | cc -c file.c -o file.o |
| Which symbols and relocations exist? | readelf -s file.o; readelf -r file.o |
| Which instructions reference symbols? | objdump -dr file.o |
| Which regions are loaded? | readelf -l executable |
| Which libraries does glibc's loader consider? | LD_DEBUG=libs ./known-program |
| Which syscalls occur? | strace -f ./program, where available |
| Which code consumes sampled CPU time? | perf record -g ./program; perf report, where permitted |

`readelf` and ELF examples are Linux-specific. On macOS, use native `nm`, `otool`, and LLDB or run the Linux track in a suitable learning environment. Tool output depends on architecture, compiler version, optimization, debug information, and permissions.

## GDB ↔ LLDB
| Task | GDB | LLDB |
| --- | --- | --- |
| Break at main | break main | breakpoint set --name main |
| Run | run | run |
| Backtrace | backtrace | bt |
| Show local values | info locals | frame variable |
| Select frame | frame 1 | frame select 1 |
| Read registers | info registers | register read |
| Source step over | next | next |
| Instruction step | stepi | thread step-inst |
| Disassemble current function | disassemble | disassemble --frame |

For memory and watchpoint syntax, consult the exact tool's manual; expression language and option names differ. The official command map covers additional cases. [[gdb]] [[lldb]]

## Instrument separately
```sh
cc -std=c17 -g -O1 -fno-omit-frame-pointer -fsanitize=address,undefined source.c -o checked
cc -std=c17 -g -O1 -pthread -fsanitize=thread threaded.c -o race-checked
```

Do not combine ASan and TSan. Runtime availability and diagnostic coverage vary. Keep the original reproducer and explain the violated invariant in addition to showing a report. [[asan]] [[ubsan]] [[tsan]]

## An evidence packet
Keep exact input, command, versions, flags, expected result, observed result, smallest known reproducer, and the earliest demonstrated bad operation. Strip unrelated logs before asking for help; retain the original complete record privately in your workspace.
