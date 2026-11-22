#include "compute.h"
uint32_t sum_words(const uint32_t *values, size_t count) {
    uint32_t sum = 0;
    for (size_t i = 0; i < count; ++i) sum += values[i];
    return sum;
}
int signed_min(int a, int b) { return a < b ? a : b; }
unsigned unsigned_min(unsigned a, unsigned b) { return a < b ? a : b; }
