#include "arena.h"
#include <assert.h>
#include <stdint.h>
#include <stdio.h>
int main(void) {
    struct Arena a = { .used = 0 };
    assert(arena_alloc(&a, 13, 1) != NULL);
    void *p = arena_alloc(&a, 16, 8);
    assert(p == a.storage + 16 && a.used == 32);
    assert((uintptr_t)p % 8 == 0);
    size_t before = a.used;
    assert(arena_alloc(&a, SIZE_MAX, 8) == NULL && a.used == before);
    assert(arena_alloc(&a, 1, 3) == NULL && a.used == before);
    assert(arena_alloc(&a, 0, 1) == NULL && a.used == before);
    assert(arena_alloc(&a, ARENA_CAPACITY-before, 1) != NULL);
    assert(arena_alloc(&a, 1, 1) == NULL);
    arena_reset(&a);
    assert(a.used == 0 && arena_alloc(&a, ARENA_CAPACITY, 1) != NULL);
    puts("arena: alignment, exact fit, overflow, failure state, reset ok");
}
