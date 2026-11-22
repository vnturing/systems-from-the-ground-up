#include "compute.h"
#include <inttypes.h>
#include <stdio.h>
int main(void) {
    const uint32_t values[] = {5, 7, 2};
    if (sum_words(values, 3) != 14 || sum_words(NULL, 0) != 0) return 1;
    if (signed_min(-1, 1) != -1 || unsigned_min((unsigned)-1, 1) != 1) return 2;
    printf("sum=%" PRIu32 " signed=-1 unsigned=1\n", sum_words(values, 3));
    return 0;
}
