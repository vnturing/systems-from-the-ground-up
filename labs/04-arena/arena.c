#include "arena.h"
void arena_reset(struct Arena *a) { a->used = 0; }
void *arena_alloc(struct Arena *a, size_t size, size_t alignment) {
    if (size == 0 || alignment == 0 || (alignment & (alignment - 1)) != 0 ||
        alignment > _Alignof(max_align_t) || a->used > ARENA_CAPACITY) return NULL;
    size_t remaining = ARENA_CAPACITY - a->used;
    size_t padding = (alignment - a->used % alignment) % alignment;
    if (padding > remaining || size > remaining - padding) return NULL;
    size_t start = a->used + padding;
    a->used = start + size;
    return a->storage + start;
}
