{"title":"Concurrency invariants","slug":"concurrency","subtitle":"Protect relationships and prove a way to stop."}
---
## Bounded queue contract
| State | Invariant / transition |
| --- | --- |
| Count | 0 <= count <= capacity under the queue mutex |
| Put | Wait while full and open; reject if closed; insert; signal not-empty |
| Take | Wait while empty and open; if closed+empty stop; remove; signal not-full |
| Close | Set closed under mutex and broadcast so all waiters recheck |
| Destruction | Unlock, join every user, then destroy synchronization objects |

A wakeup is not an item reservation. Use `while` for predicates. `pthread_cond_wait` releases-and-waits atomically relative to the mutex protocol, then reacquires before returning. [[cond]] [[cv]]

## Choose a synchronization contract
| Need | Starting choice | Caveat |
| --- | --- | --- |
| Several related mutable fields | One mutex protecting the relationship | Every access follows the discipline |
| Independent count | Atomic operation, possibly relaxed | Does not publish other ordinary data |
| One immutable publication | Stated single-writer release/acquire protocol | Target must remain alive; no hidden later conflicting writes |
| Wait for state | Condition variable + mutex + predicate | Notification is not state |
| Cross-thread lifetime transfer | Explicit ownership protocol | Atomic pointers alone do not reclaim memory safely |

The C model, platform primitives, and hardware mechanisms are related but separate. Kernel barriers are advanced comparison material, not a substitute for user-space language synchronization. [[c]] [[barriers]]

## Diagnose progress
Draw a wait-for graph for deadlock. Enforce a consistent lock order. Never join a worker while holding a lock it needs to terminate. Track useful completions to distinguish high CPU activity from useful progress. Consider starvation and fairness separately from deadlock avoidance. [[locks]]

## Diagnose scaling
Measure correctness first, then completed jobs/time, latency distribution, queue depth, and resource pressure. Hypotheses include serialized work, lock wait, memory bandwidth, false sharing, and output backpressure. Thread count is an experimental variable, not a guarantee. [[perf]] [[use]]

## Instrumentation
Use TSan where supported, in a separate build from ASan. Keep the tested workload and limits of silence explicit. For exactly-once queue checks, use item identities as well as totals; two wrong operations can cancel in a sum. [[tsan]]
