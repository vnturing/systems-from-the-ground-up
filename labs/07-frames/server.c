#define _POSIX_C_SOURCE 200809L
#include "../06-io/io.h"
#include <arpa/inet.h>
#include <errno.h>
#include <limits.h>
#include <netinet/in.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>
#define MAX_FRAME 4096u
/* 1 complete; 0 EOF before any byte; -2 truncated; -1 system error. */
static int read_exact(int fd, unsigned char *buf, size_t size) {
    size_t done = 0;
    while (done < size) {
        ssize_t n = read(fd, buf + done, size - done);
        if (n > 0) done += (size_t)n;
        else if (n == 0) return done == 0 ? 0 : -2;
        else if (errno != EINTR) return -1;
    }
    return 1;
}
static void serve(int fd) {
    for (;;) {
        unsigned char header[4];
        int result = read_exact(fd, header, sizeof header);
        if (result == 0) return;
        if (result != 1) { fputs("reject: incomplete header\n", stderr); return; }
        uint32_t length = ((uint32_t)header[0] << 24) | ((uint32_t)header[1] << 16) |
                          ((uint32_t)header[2] << 8) | (uint32_t)header[3];
        if (length > MAX_FRAME) { fputs("reject: oversized frame\n", stderr); return; }
        unsigned char body[MAX_FRAME];
        if (read_exact(fd, body, length) != 1) { fputs("reject: incomplete body\n", stderr); return; }
        for (uint32_t i = 0; i < length; ++i)
            if (body[i] >= 'a' && body[i] <= 'z') body[i] = (unsigned char)(body[i] - 'a' + 'A');
        if (write_all(fd, header, 4) < 0 || write_all(fd, body, length) < 0) {
            fputs("connection write failed\n", stderr); return;
        }
    }
}
int main(int argc, char **argv) {
    int supplied_fd = -1;
    if (argc == 3 && strcmp(argv[1], "--connected-fd") == 0) {
        char *end;
        errno = 0;
        long value = strtol(argv[2], &end, 10);
        if (errno || *argv[2] == '\0' || *end || value < 0 || value > INT_MAX) return 2;
        supplied_fd = (int)value;
        argc = 1;
    }
    long connections = 1;
    if (argc > 2) return 2;
    if (argc == 2) {
        char *end;
        errno = 0;
        connections = strtol(argv[1], &end, 10);
        if (errno || *argv[1] == '\0' || *end || connections < 1 || connections > 1000) return 2;
    }
    struct sigaction action = {0};
    action.sa_handler = SIG_IGN;
    sigemptyset(&action.sa_mask);
    if (sigaction(SIGPIPE, &action, NULL) < 0) { perror("sigaction"); return 1; }
    if (supplied_fd >= 0) {
        serve(supplied_fd);
        close(supplied_fd);
        return 0;
    }
    int listener = socket(AF_INET, SOCK_STREAM, 0);
    if (listener < 0) { perror("socket"); return 1; }
    struct sockaddr_in address = {0};
    address.sin_family = AF_INET;
    if (inet_pton(AF_INET, "127.0.0.1", &address.sin_addr) != 1) { close(listener); return 1; }
    address.sin_port = htons(0);
    if (bind(listener, (struct sockaddr *)&address, sizeof address) < 0 || listen(listener, 8) < 0) {
        perror("bind/listen"); close(listener); return 1;
    }
    socklen_t size = sizeof address;
    if (getsockname(listener, (struct sockaddr *)&address, &size) < 0) {
        perror("getsockname"); close(listener); return 1;
    }
    printf("PORT=%u\n", (unsigned)ntohs(address.sin_port));
    if (fflush(stdout) != 0) { close(listener); return 1; }
    for (long i = 0; i < connections; ++i) {
        int client;
        do { client = accept(listener, NULL, NULL); } while (client < 0 && errno == EINTR);
        if (client < 0) { perror("accept"); close(listener); return 1; }
        serve(client);
        close(client);
    }
    close(listener);
    return 0;
}
