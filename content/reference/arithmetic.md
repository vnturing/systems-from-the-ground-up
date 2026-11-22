{"title":"Representation and checked arithmetic","slug":"arithmetic","subtitle":"Derive the range before computing the result."}
---
## Compact formulas
| Task | Formula / obligation |
| --- | --- |
| Unsigned w-bit range | 0 through 2^w - 1 |
| Two's-complement w-bit signed interpretation | Low w-1 bits minus top_bit * 2^(w-1) |
| Decode little-endian bytes | Sum byte[i] * 256^i |
| Decode big-endian bytes | Accumulate value = value*256 + next_byte in a sufficiently wide unsigned type |
| Extract k low bits | x & (2^k - 1), with a valid unsigned width/shift |
| Check a*b in size_t | b == 0 or a <= SIZE_MAX/b, before multiplication |
| Check a+b in size_t | a <= SIZE_MAX-b, before addition |
| Alignment padding | (A - used%A)%A, with A > 0 and a suitably aligned base |
| binary32 normal spacing in [2^k,2^(k+1)) | 2^(k-23), assuming IEEE binary32 |
| Relative/absolute comparison | abs(a-b) <= max(abs_tol, rel_tol*max(abs(a),abs(b))), with explicit NaN/infinity policy |

## Signed addition guard
For `int` values, reject positive overflow when `b > 0 && a > INT_MAX-b`; reject negative overflow when `b < 0 && a < INT_MIN-b`. Only then compute `a+b`. Include `<limits.h>`. Do not perform the overflowing operation in order to detect it.

## Safe explicit big-endian decoding
```c
uint32_t decode(const unsigned char b[4]) {
    return ((uint32_t)b[0] << 24) | ((uint32_t)b[1] << 16) |
           ((uint32_t)b[2] << 8) | (uint32_t)b[3];
}
```

The caller supplies four live readable bytes. Our target has eight-bit bytes and `uint32_t`. Cast before shifting so integer promotions do not accidentally produce a signed overflowing operation. This does not require the input address to be aligned for `uint32_t`.

## Before you trust a result
Record type widths, signedness, promotions, operand range, intermediate precision, format assumptions, and compiler flags. A destination's type does not determine every intermediate's type. A familiar hardware instruction does not redefine signed C overflow.

## Primary reading
Use the WG14 draft's conversion/expression sections for exact language questions and Goldberg for floating-point reasoning. [[c]] [[float]]
