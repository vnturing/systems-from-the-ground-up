# Computer Systems Resources

## Knowledge

- [CS:APP — authors' official site](https://csapp.cs.cmu.edu/)
  Course inspiration and acknowledgment. Optional companion; no book purchase is needed to use this course.
- [WG14 N1570 — public C11 committee draft](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
  Language contracts: §§6.2 (types, lifetime, representation), 6.3 (conversion), 6.5 (expressions), 7.22.3 (allocation), 7.17 (atomics). The labs compile as C17 and use the shared subset; this older draft is not the final C17 standard.
- [GCC — stages of compilation](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html)
  Use -E, -S, and -c to stop at different stages; inspect artifacts before blaming the runtime.
- [GCC — warning options](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html)
  Read -Wall, -Wextra, -Wconversion, and -Wpedantic; warning-free code can still be incorrect.
- [GCC — optimization options](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html)
  Compare optimization levels and vectorization. Flags and transformations depend on compiler version and target.
- [Clang — AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html)
  Detect exercised out-of-bounds and lifetime violations; understand instrumentation limits.
- [Clang — UndefinedBehaviorSanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)
  Instrument selected undefined operations. Use diagnostics as evidence, not a complete proof of correctness.
- [Clang — ThreadSanitizer](https://clang.llvm.org/docs/ThreadSanitizer.html)
  Find exercised data races. Build separately from AddressSanitizer; platform support varies.
- [GDB — current manual](https://sourceware.org/gdb/current/onlinedocs/gdb.html/)
  Breakpoints, watchpoints, stack frames, memory examination, and disassembly.
- [LLVM — GDB to LLDB command map](https://lldb.llvm.org/use/map.html)
  Translate debugger workflows on macOS and other LLDB environments.
- [Intel — architecture and optimization manuals](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
  Instruction semantics, architectural state, exceptions, and memory-management rules. Timing varies by microarchitecture.
- [x86-64 psABI — official project](https://gitlab.com/x86-psABIs/x86-64-ABI)
  System V AMD64 argument passing, register ownership, stack alignment, and ELF conventions. Does not describe Windows x64.
- [Arm — AAPCS64](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
  AArch64 procedure-call rules. Apple has platform-specific adjustments; use this as a comparison, not an Apple ABI specification.
- [David Goldberg — floating-point arithmetic](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)
  Author's paper hosted by Oracle; rounding, cancellation, and numerical error. Work through the reasoning rather than memorizing a tolerance.
- [GNU Binutils — readelf](https://sourceware.org/binutils/docs/binutils/readelf.html)
  Inspect ELF sections, segments, symbols, and relocations. Mach-O needs different tools.
- [GNU linker — command-line options](https://sourceware.org/binutils/docs/ld/Options.html)
  Archive search order, unresolved references, and linker behavior.
- [Linux man-pages — ld.so(8)](https://man7.org/linux/man-pages/man8/ld.so.8.html)
  Dynamic loader, library search paths, relocation, and runtime diagnostics.
- [Ulrich Drepper — What Every Programmer Should Know About Memory](https://www.akkadia.org/drepper/cpumemory.pdf)
  Practitioner investigation of memory hierarchy, locality, and coherence. Published 2007: do not treat its hardware sizes or timing as current constants.
- [Arpaci-Dusseau & Arpaci-Dusseau — Paging: Introduction](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf)
  Authors' freely available OSTEP chapter; derive translation and page-table costs using original course examples.
- [OSTEP — Faster Translations (TLBs)](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf)
  Translation caching, context switches, and locality at the page level.
- [OSTEP — Free-Space Management](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-freespace.pdf)
  Splitting, coalescing, internal/external fragmentation, and allocator policy tradeoffs.
- [OSTEP — Locks](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf)
  Atomic primitives, fairness, and lock implementation tradeoffs.
- [OSTEP — Condition Variables](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf)
  Predicate-based waiting and bounded-buffer reasoning. Course code and exercises are independently authored.
- [Linux man-pages — mmap(2)](https://man7.org/linux/man-pages/man2/mmap.2.html)
  Mapping flags, permissions, file-backed memory, and mapping errors.
- [Linux man-pages — proc_pid_maps(5)](https://man7.org/linux/man-pages/man5/proc_pid_maps.5.html)
  Observe mapped ranges and permissions on Linux, not physical residency.
- [Linux man-pages — malloc(3)](https://man7.org/linux/man-pages/man3/malloc.3.html)
  Allocation, overflow risks, failure handling, and realloc ownership.
- [Linux man-pages — fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html)
  Parent/child return values, inherited state, and separate address spaces.
- [Linux man-pages — execve(2)](https://man7.org/linux/man-pages/man2/execve.2.html)
  Process-image replacement and inherited descriptor behavior.
- [Linux man-pages — waitpid(2)](https://man7.org/linux/man-pages/man2/waitpid.2.html)
  Child reaping and status decoding.
- [Linux man-pages — signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html)
  Signal dispositions, masks, delivery, and coalescing.
- [Linux man-pages — signal-safety(7)](https://man7.org/linux/man-pages/man7/signal-safety.7.html)
  Why stdio and allocation are unsafe inside asynchronous signal handlers.
- [Linux man-pages — read(2)](https://man7.org/linux/man-pages/man2/read.2.html)
  Short reads, EOF, interruption, and errors.
- [Linux man-pages — write(2)](https://man7.org/linux/man-pages/man2/write.2.html)
  Short writes, interruption, and delayed errors.
- [Linux man-pages — dup(2)](https://man7.org/linux/man-pages/man2/dup.2.html)
  Descriptors versus shared open-file descriptions and offsets.
- [Linux man-pages — fsync(2)](https://man7.org/linux/man-pages/man2/fsync.2.html)
  Flush file state, consider directory persistence, and check errors.
- [Linux man-pages — tcp(7)](https://man7.org/linux/man-pages/man7/tcp.7.html)
  Socket behavior and TCP's byte-stream contract.
- [Linux man-pages — getaddrinfo(3)](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html)
  Address-family-independent name resolution, candidate iteration, and error reporting.
- [IETF — RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293.html)
  Primary TCP protocol specification; focus on byte-stream and connection-state semantics.
- [IETF — RFC 9112: HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112.html)
  Framing, parsing, and message-length rules; explains why a toy service is not an HTTP server.
- [Linux man-pages — epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html)
  Readiness, level/edge triggering, and draining until EAGAIN.
- [POSIX manual — pthread_cond_wait](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html)
  Atomic unlock-and-wait, reacquisition, spurious wakeups, and predicate rechecking.
- [Linux kernel — memory barriers](https://www.kernel.org/doc/html/latest/core-api/wrappers/memory-barriers.html)
  Advanced comparison for compiler/CPU ordering. Kernel primitives and the Linux memory model do not replace C's user-space atomics contract.
- [Brendan Gregg — perf examples](https://www.brendangregg.com/perf.html)
  Practitioner's measured profiling examples. Counters, permissions, and virtualization support vary.
- [Brendan Gregg — the USE method](https://www.brendangregg.com/usemethod.html)
  Begin investigations with resource utilization, saturation, and errors; turn a symptom into a falsifiable question.
- [GitHub — custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
  Official deployment steps for static artifacts using GitHub Actions.

## Wisdom (Communities)

- [LLVM discussion forums](https://discourse.llvm.org/)
  Compiler behavior and tooling; start in Beginners with a minimal reproducible question.
- [KernelNewbies](https://kernelnewbies.org/)
  Kernel internals and an extension path after user-space foundations; not a prerequisite.

## Scope and currency

Consulted 2026-11-22. Runtime tool versions and hardware measurements can change. N1570 is a public C11 draft used to explain the subset shared with the C17 lab target; it is not a claim of current-standard equivalence. Historical practitioner papers supply mechanisms, not current hardware constants. No community participation preference has been stated.
