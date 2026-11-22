{"title":"The investigation card","slug":"investigation","subtitle":"A printable protocol for replacing intuition with evidence."}
---
## Before a change
1. State the intended user-visible contract and current symptom.
2. Name the failed boundary: representation, language, ABI, mapping, OS, protocol, synchronization, or capacity.
3. Preserve exact input, command, environment, versions, and flags.
4. Write two plausible hypotheses and a result that would distinguish them.
5. Choose the smallest safe experiment that can contradict your preferred explanation.

## Before a performance claim
| Question | Required answer |
| --- | --- |
| Useful work? | Correctly completed operations, not just attempted requests |
| Workload? | Sizes, distribution, concurrency, duration, warmup, seeds |
| Oracle? | Exact bytes, identities, checksums, or domain-specific valid tolerance |
| Mechanism? | Dependency, cache traffic, syscall count, lock wait, bandwidth, or other named resource |
| Samples? | Repeated raw before/after observations with drift controlled where practical |
| Upper bound? | Amdahl fraction or named resource bound and assumptions |
| Limit? | Platform/workload scope and missing evidence |

Amdahl model: `speedup = 1 / ((1-p) + p/s)` for a fixed workload with fraction `p` accelerated by factor `s` and other costs unchanged. A simple bandwidth roof is useful operations/byte times sustained bytes/second at a *named* memory boundary.

## After a repair
Rerun the original reproducer, boundary cases, error paths, and appropriate instrumentation. State the invariant that prevents recurrence. Separate “this input now passes” from “this class of behavior is prevented.” Keep the original failure as a regression input when it tests the intended external contract.

## Share a focused question
Use a minimal reproducer, exact environment, expected versus actual result, and the hypothesis you tried. Ask a relevant practitioner community about a specific uncertainty. Never post credentials or unrelated production data. The course's sources page lists suitable starting points.

## Mission check
Can you explain one operation as bytes, source semantics, compiled instructions, memory behavior, OS interaction, and ownership? If a layer is uncertain, label it and choose the next experiment. That is a stronger account than pretending every observation proves the whole model. [[use]] [[perf]]
