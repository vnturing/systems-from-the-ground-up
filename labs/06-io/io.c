#define _POSIX_C_SOURCE 200809L
#include "io.h"
#include <errno.h>
#include <unistd.h>
int write_all(int fd, const void *buffer, size_t length) {
    const unsigned char *bytes = buffer;
    size_t done = 0;
    while (done < length) {
        ssize_t n = write(fd, bytes + done, length - done);
        if (n > 0) done += (size_t)n;
        else if (n < 0 && errno == EINTR) continue;
        else { if (n == 0) errno = EIO; return -1; }
    }
    return 0;
}
