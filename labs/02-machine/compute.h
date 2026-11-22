#ifndef COMPUTE_H
#define COMPUTE_H
#include <stddef.h>
#include <stdint.h>
uint32_t sum_words(const uint32_t *values, size_t count);
int signed_min(int a, int b);
unsigned unsigned_min(unsigned a, unsigned b);
#endif
