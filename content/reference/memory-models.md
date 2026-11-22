{"title":"Cache and address-translation models","slug":"memory-models","subtitle":"Keep cache blocks, virtual pages, and live C objects separate."}
---
## Cache model
For `S` sets, `E` ways, `B` bytes/line:

| Quantity | Calculation |
| --- | --- |
| Data capacity | S * E * B |
| Block number | floor(byte_address / B) |
| Set | block_number mod S |
| Tag | floor(block_number / S) |
| Offset | byte_address mod B |
| Average time in the simple serial model | hit_time + miss_rate * additional_miss_penalty |

Our simulator starts empty, processes one-byte read addresses, uses LRU replacement, and omits prefetch, writes, multiple levels, coherence, and overlap. It teaches mapping; it is not a hardware performance predictor. Historical practitioner experiments motivate hypotheses for real machines. [[memory]]

## Paging model
For page size `P`:

| Quantity | Calculation |
| --- | --- |
| VPN | floor(virtual_address / P) |
| Offset | virtual_address mod P |
| Physical address | frame * P + offset, only after mapping/permission checks |
| Flat page-table entries | 2^(virtual_bits - log2(P)) |
| Approximate TLB reach | entry_count * page_size for the selected structure |

The interactive model is a 16-bit virtual address space with configurable power-of-two pages and a toy readable page table. Real tables use architecture-specific formats and multiple levels. [[paging]] [[tlb]]

## Three misses and a fault
| Event | What is missing / unsatisfied | Does it imply disk I/O? |
| --- | --- | --- |
| Data-cache miss | Requested block at a selected cache level | No |
| TLB miss | Cached translation | No |
| Page-table cache miss | Metadata at a selected cache level | No |
| Page fault | Translation/protection condition needs OS handling | No; some faults need I/O, others do not |

## Memory accounting distinctions
Requested live bytes, allocator-held bytes, virtual mapped bytes, resident pages, and private dirty pages are different measurements. `free` can release application ownership while the allocator retains pages. `mmap` can establish a large virtual range without immediate private residency. A readable mapped page cannot prove an individual C pointer is in bounds or alive. [[malloc]] [[mmap]] [[maps]]
