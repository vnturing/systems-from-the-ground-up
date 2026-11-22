/* Deliberately invalid when invoked with an index >= 4. Run only as the local ASan exercise. */
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
int main(int argc, char **argv) {
    if (argc != 2) return 2;
    char *end = NULL;
    errno = 0;
    long index = strtol(argv[1], &end, 10);
    if (errno || *argv[1] == '\0' || *end != '\0' || index < 0 || index > 100) return 2;
    int *values = calloc(4, sizeof *values);
    if (values == NULL) return 3;
    values[index] = 42; /* BUG: the parser's 100 bound is not the allocation's bound. */
    printf("value=%d\n", values[index]);
    free(values);
    return 0;
}
