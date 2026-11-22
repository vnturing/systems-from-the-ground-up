#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <unistd.h>
int main(void) {
    int ends[2];
    if (pipe(ends) < 0) { perror("pipe"); return 1; }
    if (fflush(NULL) != 0) { perror("fflush"); return 1; }
    pid_t child = fork();
    if (child < 0) { perror("fork"); close(ends[0]); close(ends[1]); return 1; }
    if (child == 0) {
        close(ends[1]);
        if (ends[0] != STDIN_FILENO) {
            if (dup2(ends[0], STDIN_FILENO) < 0) _exit(126);
            close(ends[0]);
        }
        /* execlp is used in this single-threaded teaching process. */
        execlp("tr", "tr", "a-z", "A-Z", (char *)NULL);
        _exit(127);
    }
    close(ends[0]);
    const char message[] = "systems need evidence\n";
    size_t done = 0;
    int failed = 0;
    while (done < sizeof message - 1) {
        ssize_t n = write(ends[1], message + done, sizeof message - 1 - done);
        if (n > 0) done += (size_t)n;
        else if (n < 0 && errno == EINTR) continue;
        else { failed = 1; break; }
    }
    if (close(ends[1]) != 0) failed = 1;
    int status;
    pid_t waited;
    do { waited = waitpid(child, &status, 0); } while (waited < 0 && errno == EINTR);
    if (waited < 0) { perror("waitpid"); return 1; }
    return failed || !WIFEXITED(status) || WEXITSTATUS(status) != 0;
}
