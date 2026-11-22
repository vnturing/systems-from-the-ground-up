#ifndef COURSE_ARENA_H
#define COURSE_ARENA_H
#include <stddef.h>
#define ARENA_CAPACITY 128
struct Arena {
    _Alignas(max_align_t) unsigned char storage[ARENA_CAPACITY];
    size_t used;
};
void arena_reset(struct Arena *a);
void *arena_alloc(struct Arena *a, size_t size, size_t alignment);
#endif
