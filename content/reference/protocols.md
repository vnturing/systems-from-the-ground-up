{"title":"Process, I/O, and framing contracts","slug":"protocols","subtitle":"Progress, ownership, and EOF at each boundary."}
---
## Process lifecycle
| Operation | Success | Failure / obligation |
| --- | --- | --- |
| fork | Parent receives child PID; child receives zero | Negative return creates no child; clean up acquired state |
| exec | Replaces current image; does not return to old code | Returns on failure; controlled child path must terminate appropriately |
| waitpid | Collects child state | Handle interruption/errors; decode status with matching macros |
| dup | Another descriptor refers to the same open-file description | Shared offset; close each owned handle |

Every process path needs descriptor ownership. Pipe EOF arrives after buffered bytes drain and every writer reference closes. Signals are notifications, not stored counts of every event. Keep asynchronous handlers inside the async-signal-safe contract. [[fork]] [[exec]] [[wait]] [[dup]] [[safe]]

## Blocking byte-transfer loop
1. Keep `done <= length` and a live buffer of the promised capacity.
2. Request from `buffer+done` for `length-done` bytes within interface limits.
3. Positive result advances progress by the actual count.
4. EINTR retries under the operation's documented contract.
5. EOF, no progress, and other errors are classified deliberately.
6. Nonblocking EAGAIN transfers control to readiness waiting; it is not a busy retry.

Check signed syscall results before unsigned conversion. Do not infer remote processing or persistence from a local write count. [[read]] [[write]]

## Course frame protocol
| Field | Contract |
| --- | --- |
| Header | Four bytes, unsigned big-endian payload length |
| Payload | Exactly the declared number of bytes |
| Length bound | 0 through 4096 inclusive |
| Transformation | ASCII lowercase letters become uppercase; other bytes unchanged |
| Success response | Same length encoding and transformed payload |
| Invalid input | Close/reject; no successful response for the invalid frame |
| EOF | Clean between frames; truncation inside header or payload |

This protocol is original and deliberately small. It is not HTTP. TCP supplies a byte stream, so input chunks may split or combine any frame boundaries. [[rfc9293]] [[http]]

## Shutdown ledger
For each resource, record creator, owner, transfer point, normal release, failure release, and last possible user. Include descriptors, buffers, queue entries, locks, and worker threads. Join users before destroying their synchronization state.
