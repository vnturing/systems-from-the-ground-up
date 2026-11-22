# Below the Surface

An original, practical computer systems course for learning to **explain and debug real programs from source code down to hardware**, starting with little C experience.

Open [index.html](index.html) to begin. Read [setup.html](setup.html) for the lab environment, [sources.html](sources.html) for the source trail, and [MISSION.md](MISSION.md) for the teaching goal.

## What is here

- 40 fully written lessons across 13 units, with over 23,000 words of explanation, derivations, worked feedback, transfer exercises, and primary reading links.
- A C bridge, representation and arithmetic, machine code and ABI, linking/loading, CPU models and measurement, caches/coherence, virtual memory, allocation/ownership, processes/signals, robust I/O/durability, networking/framing/backpressure, and synchronization/atomics/progress.
- Nine substantial lab guides, eight sets of executable reference exercises, a native checker, and a capstone assignment/report/rubric.
- Six interactive workbenches: finite-width bits, cache mapping/LRU, virtual-address translation, stream framing, interleavings, and Amdahl's law.
- Seven printable references, including the canonical glossary.
- Full-text lesson search, reversible completion, quiz feedback, reflections, a simple spaced-review queue, dark/light theme, and validated JSON progress import/export.
- No backend, CDN, external fonts, npm dependencies, analytics, or paid account required. Core reading and worked feedback work without JavaScript.

## Read and serve locally

Open `index.html` directly, or serve the root for a stable browser origin:

```sh
cd /Users/tawanda/Documents/repos/systems-from-the-ground-up
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`. Persistent storage and clipboard access can vary for file URLs; use HTTP for reliable cross-page study records. Progress is browser/origin-local and does not sync automatically. Export before moving hosts or devices.

## Build and verify

Building requires Python 3.12+ and only its standard library. Native lab checks require Python 3.10+, a C17 compiler, POSIX APIs, and `tr`. Model checks require Node 18+.

```sh
python3 tools/build.py
python3 tools/validate.py
node tools/test-models.cjs
python3 labs/check.py
python3 labs/check.py --sanitize
```

Where a local listener is permitted, add:

```sh
python3 labs/check.py --lab 7 --loopback
```

The output is `dist/`. The source tree's generated HTML is also directly browsable. `downloads/labs.zip` is a deterministic source-only lab bundle with instructions and the capstone report template.

`tools/browser-check.mjs` is an optional dependency-free Chrome/DevTools smoke check. Set `CHROME_BIN` if Chrome is not at the macOS default path. It exercises layouts and interactions and saves screenshots under `.build/`. It requires permission to launch a browser; it was not runnable in the authoring sandbox. See [VERIFICATION.md](VERIFICATION.md) for checks actually completed.

## Deploy to GitHub Pages

1. Make **this directory** the root of a GitHub repository, using `main` as the publishing branch. If you have not initialized it, run `git init -b main`, add/commit the course, and push to your chosen remote.
2. In GitHub repository **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Push to `main`, or manually run **Check and publish course** from the Actions tab after selecting the publishing setting.

The included workflow builds and validates the site, runs native/model checks on Ubuntu, and uploads only `dist/`. Pull requests run checks without deployment. Relative links support repository-subpath URLs. The workflow follows [GitHub's official custom Pages workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

For any other static host, publish the contents of `dist/`. No publishing or remote repository creation has been performed from this workspace.

## Edit and continue teaching

- Edit `content/lessons/*.md`, `content/labs/*.md`, and `content/reference/*.md`; run `python3 tools/build.py` afterward.
- Every content file starts with a JSON metadata object, a line containing `---`, then a deliberately small Markdown subset: headings, paragraphs, fenced code, tables, flat lists, links, bold/emphasis, citations `[[source-key]]`, and `::: deep Title` / `::: solution Title` blocks closed with `:::`.
- `content/sources.json` holds the source catalog; the builder emits both `sources.html` and `RESOURCES.md`.
- Reuse `assets/` components. `models.js` contains deterministic calculations, `workbenches.js` presents them, `study.js` validates study state, and `course.js` handles navigation/study interactions.
- Generated `lessons/`, `reference/`, and lab-guide HTML should not be edited by hand. Rebuild after changes.
- Ask the teaching agent with a lesson number, prediction, and evidence. Learning records capture demonstrated understanding or disclosed starting assumptions, not pages merely covered. Browser checkmarks are self-reports and never automatically create repository learning records.

## Scope and acknowledgment

Inspired by the programmer-centered approach of *Computer Systems: A Programmer's Perspective* by Randal E. Bryant and David R. O'Hallaron. Independent and unaffiliated. This course uses original prose, examples, visual components, and labs; it does not reproduce the textbook's text, figures, or proprietary lab assignments. Linked external works retain their respective rights.

The course labels target assumptions: C17 subset, POSIX APIs, Linux ELF/System V AMD64 for specific system examples, and a native macOS/Apple Silicon C track. Historical practitioner sources provide mechanisms to investigate, not current hardware timing constants. An optional Docker tool environment is supplied but was not built here.
