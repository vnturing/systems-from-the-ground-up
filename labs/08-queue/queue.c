#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <inttypes.h>
#include <pthread.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#ifndef QUEUE_CAPACITY
#define QUEUE_CAPACITY 8
#endif
#define ITEMS 10000
struct Queue {
    unsigned items[QUEUE_CAPACITY];
    size_t head, tail, count;
    int closed;
    pthread_mutex_t mutex;
    pthread_cond_t not_empty, not_full;
};
static struct Queue q = { .mutex = PTHREAD_MUTEX_INITIALIZER,
    .not_empty = PTHREAD_COND_INITIALIZER, .not_full = PTHREAD_COND_INITIALIZER };
static pthread_mutex_t results_mutex = PTHREAD_MUTEX_INITIALIZER;
static unsigned seen[ITEMS];
static size_t consumed;
static uint64_t sum;
static void require(int code) {
    if (code != 0) { fprintf(stderr, "pthread: %s\n", strerror(code)); exit(2); }
}
static int put(unsigned item) {
    require(pthread_mutex_lock(&q.mutex));
    while (q.count == QUEUE_CAPACITY && !q.closed) require(pthread_cond_wait(&q.not_full, &q.mutex));
    if (q.closed) { require(pthread_mutex_unlock(&q.mutex)); return 0; }
    q.items[q.tail] = item;
    q.tail = (q.tail + 1) % QUEUE_CAPACITY;
    ++q.count;
    require(pthread_cond_signal(&q.not_empty));
    require(pthread_mutex_unlock(&q.mutex));
    return 1;
}
static int take(unsigned *item) {
    require(pthread_mutex_lock(&q.mutex));
    while (q.count == 0 && !q.closed) require(pthread_cond_wait(&q.not_empty, &q.mutex));
    if (q.count == 0) { require(pthread_mutex_unlock(&q.mutex)); return 0; }
    *item = q.items[q.head];
    q.head = (q.head + 1) % QUEUE_CAPACITY;
    --q.count;
    require(pthread_cond_signal(&q.not_full));
    require(pthread_mutex_unlock(&q.mutex));
    return 1;
}
static void close_queue(void) {
    require(pthread_mutex_lock(&q.mutex));
    q.closed = 1;
    require(pthread_cond_broadcast(&q.not_empty));
    require(pthread_cond_broadcast(&q.not_full));
    require(pthread_mutex_unlock(&q.mutex));
}
static void *worker(void *unused) {
    (void)unused;
    unsigned item;
    while (take(&item)) {
        require(pthread_mutex_lock(&results_mutex));
        if (item >= ITEMS) { fputs("invalid item\n", stderr); exit(3); }
        ++seen[item]; ++consumed; sum += item;
        require(pthread_mutex_unlock(&results_mutex));
    }
    return NULL;
}
int main(int argc, char **argv) {
    long workers = 4;
    if (argc > 2) return 2;
    if (argc == 2) {
        char *end;
        errno = 0;
        workers = strtol(argv[1], &end, 10);
        if (errno || *argv[1] == '\0' || *end || workers < 1 || workers > 32) return 2;
    }
    pthread_t threads[32];
    for (long i = 0; i < workers; ++i) require(pthread_create(&threads[i], NULL, worker, NULL));
    for (unsigned i = 0; i < ITEMS; ++i) if (!put(i)) return 3;
    close_queue();
    for (long i = 0; i < workers; ++i) require(pthread_join(threads[i], NULL));
    if (consumed != ITEMS || sum != (uint64_t)ITEMS*(ITEMS-1)/2) return 1;
    for (unsigned i = 0; i < ITEMS; ++i) if (seen[i] != 1) return 1;
    require(pthread_cond_destroy(&q.not_empty));
    require(pthread_cond_destroy(&q.not_full));
    require(pthread_mutex_destroy(&q.mutex));
    require(pthread_mutex_destroy(&results_mutex));
    printf("queue: %zu unique items, sum=%" PRIu64 ", workers=%ld capacity=%d\n", consumed, sum, workers, QUEUE_CAPACITY);
    return 0;
}
