# Below the Surface: native labs

Run from the directory containing labs/:

    python3 labs/check.py
    python3 labs/check.py --sanitize
    python3 labs/check.py --lab 7 --loopback

Requires Python 3.10+, C17 compiler, POSIX interfaces, and tr. No third-party Python packages.
Build outputs go to .build/. Set CC to choose a compiler. The default protocol tests exercise the actual handler with inherited connected Unix-domain sockets. --loopback additionally tests the TCP listener and requires local bind permission.

Read the full lab guides in the course website. The reference programs are inspectable baselines; extension projects and the capstone are not silently graded by check.py. Timing is observed, never asserted to satisfy a fixed speedup. The intentionally broken bounds-bug.c is run only by the sanitizer exercise, with an expected diagnostic.

Docker is optional: see setup.html in the full course or the root README. If using the download without the site, run `docker build -t below-surface-labs -f labs/Dockerfile .`, then mount this directory at /course. Architecture emulation is not native performance evidence.
