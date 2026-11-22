# Verification record

Authoring environment: macOS, arm64, Apple Clang through `cc`, Python 3.15, Node 26. Recorded 2026-11-22.

Completed locally:

- `python3 tools/build.py`: 40 lessons, nine lab guides, seven references, seven top-level reading/navigation pages; 63 HTML pages total.
- `python3 tools/validate.py`: all internal targets and anchors, repository-relative URLs, referenced assets, one main heading/page, language/title metadata, lesson source keys, worked feedback/depth sections, and equal-word-count quiz choices.
- `node tools/test-models.cjs`: finite-width representations, endian encodings, cache conflicts/associativity, translation and permission outcomes, framing at all single split points and 100 seeded multi-chunk partitions, malformed frames, interleavings, Amdahl calculations, import validation, and review intervals.
- `python3 labs/check.py`: native compiler artifacts, separate compilation/link failure, checksum equivalence, arena boundary/invariant checks, process/pipe output, actual helper fault injection, binary copying, EPIPE handling, actual compiled frame handler over connected sockets, and repeated bounded-queue uniqueness/drain checks.
- `python3 labs/check.py --sanitize`: the same native checks under ASan/UBSan plus the expected ASan diagnostic for the separate intentionally invalid bounds exercise.

Limits:

- The sandbox forbids binding a listening port (`Operation not permitted`), so TCP listener setup was not exercised locally. The actual compiled parser and I/O handler were exercised through inherited connected Unix-domain sockets. `--loopback` adds the TCP integration check on an unrestricted host; the GitHub workflow includes it.
- Chrome exited on launch in the sandbox, so visual/mobile/browser-interaction QA has not been completed. The optional browser smoke script remains available for a local environment that permits Chrome.
- Linux ELF tools, perf counters, TSan, and the optional Docker image were not run here. These are labeled platform-dependent learning paths, not reported as passing checks.
- No GitHub remote was created and no deployment occurred. The Actions workflow is prepared but has not run on GitHub.
- Automated checks do not assess completion of the learner's capstone, establish universal speedups, or prove absence of all bugs.
