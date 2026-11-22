#define _POSIX_C_SOURCE 200809L
#include <assert.h>
#include <errno.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>
#include <sys/types.h>
#include <unistd.h>
static ssize_t injected_write(int fd, const void *buffer, size_t length);
#define write injected_write
#include "io.c"
#undef write
static const char data[] = "0123456789";
static size_t call_index, consumed;
static int mode;
static ssize_t injected_write(int fd, const void *buffer, size_t length) {
    assert(fd == 99);
    assert(buffer == data + consumed && length == 10 - consumed);
    if (mode == 1) return 0;
    if (mode == 2) { errno = EPIPE; return -1; }
    const ssize_t results[] = {3, -1, 2, 5};
    assert(call_index < 4);
    ssize_t n = results[call_index++];
    if (n < 0) { errno = EINTR; return -1; }
    consumed += (size_t)n;
    return n;
}
int main(void) {
    assert(write_all(99, data, 10) == 0 && consumed == 10 && call_index == 4);
    consumed = 0; mode = 1;
    assert(write_all(99, data, 10) == -1 && errno == EIO);
    mode = 2;
    assert(write_all(99, data, 10) == -1 && errno == EPIPE);
    assert(write_all(99, data, 0) == 0);
    puts("write_all: actual helper passed partial, EINTR, no-progress, and error injection");
}
