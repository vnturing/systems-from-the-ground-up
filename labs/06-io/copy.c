#define _POSIX_C_SOURCE 200809L
#include "io.h"
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <unistd.h>
int main(void) {
    struct sigaction action = {0};
    action.sa_handler = SIG_IGN;
    sigemptyset(&action.sa_mask);
    if (sigaction(SIGPIPE, &action, NULL) != 0) { perror("sigaction"); return 1; }
    unsigned char buffer[4096];
    for (;;) {
        ssize_t n = read(STDIN_FILENO, buffer, sizeof buffer);
        if (n > 0) {
            if (write_all(STDOUT_FILENO, buffer, (size_t)n) < 0) { perror("write"); return 1; }
        } else if (n == 0) return 0;
        else if (errno != EINTR) { perror("read"); return 1; }
    }
}
