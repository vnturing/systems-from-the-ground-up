#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
static double now(void) {
    struct timespec ts;
    if (clock_gettime(CLOCK_MONOTONIC, &ts) != 0) { perror("clock_gettime"); exit(2); }
    return (double)ts.tv_sec + (double)ts.tv_nsec / 1e9;
}
int main(int argc, char **argv) {
    size_t n = 1024;
    if (argc > 2) return 2;
    if (argc == 2) {
        char *end;
        errno = 0;
        unsigned long input = strtoul(argv[1], &end, 10);
        if (errno || *argv[1] == '\0' || *end || input < 1 || input > 4096) return 2;
        n = (size_t)input;
    }
    uint32_t *matrix = malloc(n * n * sizeof *matrix); /* n <= 4096 bounds this product on our targets. */
    if (!matrix) return 3;
    for (size_t i = 0; i < n * n; ++i) matrix[i] = (uint32_t)(i % 97);
    uint64_t row = 0, col = 0;
    double t0 = now();
    for (size_t i = 0; i < n; ++i)
        for (size_t j = 0; j < n; ++j) row += matrix[i*n+j];
    double t1 = now();
    for (size_t j = 0; j < n; ++j)
        for (size_t i = 0; i < n; ++i) col += matrix[i*n+j];
    double t2 = now();
    printf("n=%zu row=%.9f column=%.9f checksum=%" PRIu64 "\n", n, t1-t0, t2-t1, row);
    free(matrix);
    if (row != col) return 1;
    return 0;
}
