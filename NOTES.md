# Teaching notes

- User chose: explain and debug real programs from source code down to hardware; assume little C experience.
- User explicitly values detail and depth: the whole iceberg, not its tip.
- Teaching starts in this dedicated directory, as explicitly requested; the parent repos directory is not the course workspace.
- Coverage is not mastery. Do not create learning records until the learner demonstrates understanding or discloses prior knowledge. The browser's completion and confidence records are self-reports, not proof of mastery.
- Core lessons isolate one skill; deeper sections, derivations, transfer questions, primary readings, and longer labs provide depth.
- Reference target: C17 subset, POSIX interfaces, Linux ELF and System V AMD64 for system-specific examples. macOS/Apple Silicon differences must be called out. Do not present this as a universal machine model.
- Local progress uses this browser and origin, supports export/import, and does not sync automatically or modify learning-records.
- Build is deterministic and uses Python's standard library. Never hand-edit generated lessons or reference HTML; edit content and tools/build.py.
