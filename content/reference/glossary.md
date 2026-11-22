{"title":"Systems glossary","slug":"glossary","subtitle":"One vocabulary across every layer."}
---
## Language and representation
| Term | Meaning in this course |
| --- | --- |
| Object | Storage with a type and lifetime under the C model; not necessarily an object-oriented instance. |
| Value | An interpretation used by an expression, distinct from raw representation bytes. |
| Byte | C's addressable storage unit; eight bits on the course targets, at least eight by the language contract. |
| Representation | The bits/bytes used to encode a value under a defined format. |
| Endianness | Ordering of multi-byte value bytes at increasing addresses. |
| Alignment | A requirement on addresses suitable for objects of a type. |
| Padding | Layout bytes/bits not part of a named member's value representation. |
| Lifetime | The interval during which an object exists and may be used according to its contract. |
| Ownership | The protocol assigning responsibility for resource use, transfer, and release. |
| Borrow | Permission to use a resource without acquiring its release responsibility. |
| Dangling pointer | A pointer whose former target no longer has a usable lifetime. |
| Undefined behavior | Behavior for which the language imposes no requirements after a violated condition. |
| Implementation-defined | Behavior the implementation chooses and documents where the standard permits alternatives. |
| Integer promotion | Conversion of small integer types before many arithmetic operations. |
| Modular arithmetic | Arithmetic reduced modulo a fixed range, as for unsigned integer types. |
| Significand | The significant digits of a floating-point value. |
| ULP | A unit in the last place for a specified value/format context; spacing is magnitude-dependent. |
| Subnormal | A floating-point encoding supporting gradual underflow with reduced precision near zero. |

## Translation and execution
| Term | Meaning in this course |
| --- | --- |
| Translation unit | Source after preprocessing, considered as a compilation input. |
| Declaration | Introduces a name/type contract; need not provide storage or a function body. |
| Definition | Supplies a function body or an object's defining storage declaration under language rules. |
| Object file | Relocatable machine code/data and metadata; distinct from a C object. |
| Symbol | A named entity in link/debug metadata, such as a function definition or reference. |
| Linkage | Source-level rules about whether declarations denote the same entity across scopes/units. |
| Relocation | Metadata-directed adjustment of a reference after placement or runtime binding. |
| Section | Link-oriented object/executable subdivision such as code, data, or symbol metadata. |
| Segment | Loader-oriented region described by program headers in ELF. |
| ABI | Binary interface agreement, including calls, layout, and object conventions. |
| ISA | Instruction-set architecture: programmer-visible machine operations and state. |
| Microarchitecture | A particular implementation of an ISA. |
| Register | Named architectural state; hardware may rename it internally. |
| Stack frame | State associated with an invocation; optimized execution may not use a conventional frame. |
| Caller-saved | A register whose needed value the caller must preserve across a call. |
| Callee-saved | A register whose incoming value the callee must restore if it changes it. |
| Latency | Time for one operation/result under a specified model. |
| Throughput | Completed useful work per unit time under a specified workload. |
| Dependency | A relation requiring an operation's value or ordering before another operation can proceed. |
| SIMD | One instruction operating on multiple data lanes. |

## Memory hierarchy
| Term | Meaning in this course |
| --- | --- |
| Cache line | Unit of cached data transfer/storage and often coherence tracking. |
| Set | Group of cache locations to which a block can map under the model. |
| Associativity | Number of line slots per cache set. |
| Tag | Block-identity information distinguishing candidates mapping to one set. |
| Locality | Reuse in nearby addresses (spatial) or time (temporal). |
| Conflict miss | A miss due to mapping constraints rather than simply total capacity. |
| Coherence | Coordination of cached copies under the architecture's per-location rules. |
| False sharing | Contention caused by independent logical objects sharing a coherence line. |
| Virtual address | An address interpreted within an address-space context. |
| Page / frame | Fixed-size virtual unit / corresponding physical-memory unit in the paging model. |
| Page table | Mapping and permission metadata used for address translation. |
| TLB | Cache of address translations, distinct from a cache of application data. |
| Page fault | Exception requiring OS handling of a translation/protection condition; may be recoverable. |
| Copy-on-write | Sharing until a write requires private storage while preserving separate semantics. |
| RSS | Resident-set accounting; not identical to requested live allocation bytes. |
| Internal fragmentation | Unused space inside an allocated block. |
| External fragmentation | Free space split so a needed contiguous request cannot be satisfied. |
| Arena | Storage region with grouped allocation/lifetime, often reset as a unit. |

## OS, I/O, networking, concurrency
| Term | Meaning in this course |
| --- | --- |
| Process | Execution and resource context with an address space and OS-managed identity. |
| Thread | Execution context sharing process resources with other threads under platform rules. |
| System call | Deliberate request crossing into an OS service interface. |
| Interrupt | Asynchronous hardware event relative to the interrupted instruction stream in our model. |
| Signal | OS process/thread notification interface, distinct from the CPU handler itself. |
| Descriptor | Process-local integer handle referring to an open resource description. |
| Open-file description | Shared kernel state behind descriptors, including offset where applicable. |
| EOF | An interface result indicating stream ending under its object-specific semantics. |
| Short transfer | A positive count smaller than requested; not automatically an error. |
| Durability | Persistence guarantee under a specified failure/storage model. |
| Framing | Rules partitioning a byte stream into application records. |
| Readiness | Notification that attempting I/O may make progress. |
| Backpressure | Limiting intake or production when downstream capacity is insufficient. |
| Data race | Conflicting non-atomic accesses without required ordering under the language model. |
| Mutex | Primitive coordinating mutual exclusion and visibility under its contract. |
| Predicate | State condition checked under synchronization before proceeding or waiting. |
| Condition variable | Wait/notification mechanism paired with a protected predicate and mutex. |
| Happens-before | Language-model ordering relation used to establish valid inter-thread communication. |
| Release / acquire | Matching atomic ordering operations that can establish synchronization. |
| Deadlock | Participants cannot progress because of a circular or equivalent unsatisfiable wait. |
| Starvation | A participant fails to obtain needed progress despite others progressing. |
| Livelock | Activity continues without useful completion. |

## Precision rule
When two layers use the same word, name the layer. A C object is not an object file; an atomic rename is not an atomic C increment; a cache miss is not a page fault. See the sources directory for primary definitions and platform scope.
