{"title":"Set up the laboratory","subtitle":"Read anywhere. Experiment locally."}
---
## Two environments, one course
The website is static HTML, CSS, and JavaScript. Reading and worked solutions need no compiler or account. The native labs need Python 3.10 or newer, a C17 compiler, POSIX interfaces, and `tr` for the pipeline lab. No third-party Python packages are required.

Our reference examples use C17's shared C11/C17 subset, Linux ELF, and System V AMD64 where labeled. Native C labs also run on macOS/Apple Silicon. Architecture-specific assembly, Linux `/proc`, `strace`, `readelf`, and `perf` require the corresponding platform and tool support.

## Native Mac path
Check `cc --version`, `python3 --version`, and `uname -m`. Apple's command-line tools supply a compiler and LLDB; install them through your normal development setup if absent. Use LLDB instead of assuming GDB can launch without extra permissions. The compiler's name `cc` may resolve to Clang even when examples discuss GCC options.

Unzip the lab download and run from its root, or use the course repository root:

```sh
python3 labs/check.py
python3 labs/check.py --sanitize
python3 labs/check.py --lab 7 --loopback
```

The first command builds and checks Labs 01–08. Lab 09 is an assessed investigation, not an automated grade. The sanitizer command additionally exercises the deliberately invalid bounds example and expects a diagnostic for that separate program. It does not silently make every reference program unsafe.

Default protocol checks use real connected Unix-domain sockets. `--loopback` additionally exercises a bound TCP listener and requires local networking permission. An environment that prohibits bind can still run the connected-socket checks. The authoring environment exercised the connected-socket path, not the listener path.

## Linux path
Use a disposable Linux development environment with a compiler, Python, make-independent shell tools, and optional GDB/binutils/strace/perf. On a Debian/Ubuntu-style system, the following package set supplies the core tools; use your distribution's normal installation process:

```sh
sudo apt-get update
sudo apt-get install build-essential python3 gdb binutils strace
```

`perf` packaging and permissions are kernel/distribution-specific. A container can provide Linux user-space artifacts without faithfully exposing hardware counters. A VM on Apple Silicon normally runs AArch64 Linux; request an x86-64 environment if you specifically want executable AMD64 artifacts. Emulation timing is not native-CPU performance evidence.

The optional `labs/Dockerfile` provides a reproducible *tool list*, based on Debian bookworm. Build it explicitly if Docker is part of your workflow:

```sh
docker build -t below-surface-labs -f labs/Dockerfile .
docker run --rm -it -v "$PWD:/course" -w /course below-surface-labs bash
```

Inside, run `python3 labs/check.py --loopback`. The base tag and package repositories can change; this is not a frozen binary environment. Add `--platform linux/amd64` to both commands only when you intentionally want that architecture and accept emulation on a non-AMD64 host.

## Reading the site locally
Open `index.html` directly for reading. The generated catalog loads as a script, so search and workbenches need no fetch server. Browser policy may restrict persistent storage or clipboard access for local files; use the export button to keep a copy and use a local HTTP server for a stable origin when available:

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000/`. A different hostname, port, browser profile, or hosted domain has a separate local-storage record. Export/import is the explicit migration path.

## GitHub Pages deployment
The included Actions workflow builds `dist/`, validates internal links and source metadata, runs native lab checks on Ubuntu, and uploads the static artifact. Push this directory as the repository root on `main`; in repository Settings → Pages, select GitHub Actions as the publishing source. Run the workflow manually if changing the setting after the first push. No domain or backend configuration is needed.

All course links are relative, supporting project URLs such as `https://account.github.io/repository/`. For another static host, upload the generated `dist/` contents. Deployment has not been performed from this workspace. Follow GitHub's official custom-workflow guide if repository settings or service requirements change. [[pages]]

## What a passing check means
The checks exercise specified artifacts and inputs. They do not prove absence of every bug, guarantee a particular speedup, or certify the capstone. Keep tool support, skipped platform checks, and the tested workload beside your conclusions.
