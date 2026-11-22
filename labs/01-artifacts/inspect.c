#include <inttypes.h>
#include <limits.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <float.h>
struct Record { char kind; int value; char active; };
static int product(size_t a, size_t b, size_t *out) {
    if (b != 0 && a > SIZE_MAX / b) return 0;
    *out = a * b;
    return 1;
}
int main(void) {
    uint32_t word = UINT32_C(0x0A1B2C3D);
    unsigned char bytes[sizeof word];
    memcpy(bytes, &word, sizeof word);
    printf("CHAR_BIT=%d int=%zu pointer=%zu\n", CHAR_BIT, sizeof(int), sizeof(void *));
    printf("word=%" PRIx32 " bytes:", word);
    for (size_t i = 0; i < sizeof bytes; ++i) printf(" %02x", (unsigned)bytes[i]);
    printf("\nrecord size=%zu alignment=%zu value_offset=%zu\n", sizeof(struct Record),
           _Alignof(struct Record), offsetof(struct Record, value));
    size_t result = 0;
    if (!product(170, 24, &result) || result != 4080) return 1;
    if (product(SIZE_MAX, 2, &result)) return 2;
    volatile float large = 16777216.0f;
    float next = large + 1.0f;
    printf("float radix=%d precision=%d eval=%d increment=%.0f\n",
           FLT_RADIX, FLT_MANT_DIG, FLT_EVAL_METHOD, (double)next);
    puts("checked multiplication: ok");
    return 0;
}
