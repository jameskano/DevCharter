# Common stack and command authority

These profiles preserve bounded v0 awareness for common stacks. They help discovery; they do not
authorize versions, dependencies, configuration, or commands. Prefer repository instructions and
manifest-defined scripts, then official current documentation. If evidence is ambiguous, stale, or
outside these profiles, ask or create a research task in the proposal instead of guessing.

## Shared command rule

Never infer a command merely because it is conventional. Read the nearest applicable manifest,
configuration, wrapper, contributor documentation, and CI. For an existing project, propose the
exact verified command. For a new project, record initializer and tool choices in the proposal and
detailed specification before installation. Shell aliases and global tools are not portable command
authority.

| Stack | Reliable detection and authority | Typical structure, native tools, and critical harness opportunities | Frequent conflicts and unsafe assumptions | Current source to check when needed |
|---|---|---|---|---|
| JavaScript/TypeScript | nearest `package.json`, lockfile, workspace config, `tsconfig*.json`; declared scripts are command authority | `src`, framework routes, tests; package-manager-native format/lint/type/test/build/run scripts; build and material browser journeys | Do not mix npm/pnpm/yarn/bun, assume a framework from a dependency, or invent missing scripts | selected package manager, TypeScript, test tool, and framework official docs |
| Python | `pyproject.toml` first; supported lock/config files and source imports as corroboration | package or `src` layout, tests; environment, format/lint/type/test/build commands owned by declared tools; package/import and service journeys | Do not treat arbitrary TOML sections, global executables, examples, or test-only imports as runtime authority | Python packaging guide and each declared tool's official docs |
| Rust | nearest `Cargo.toml` and `Cargo.lock`; workspace membership matters | crates, `src`, tests/examples; Cargo format, lint, test, build, and run capabilities; workspace and binary/library journeys | Do not assume every workspace member or feature set is active; inspect toolchain and target needs | Cargo, rustfmt, Clippy, and selected framework official docs |
| Go | nearest `go.mod`/`go.work`, source packages, and repository docs | packages, `cmd`, `internal`, tests; Go format, vet/test/build/run capabilities; package and executable/service journeys | Do not infer a main package, workspace boundary, generated-code policy, or external tool installation | current Go command and selected tool official docs |
| JVM (Java/Kotlin, Maven) | nearest effective `pom.xml`, wrapper, source sets, and repository docs | Maven modules and standard/custom source roots; wrapper-owned test/package/run/plugin goals; module and packaged-application journeys | Dependency management, profiles, plugins, examples, or test scope do not prove runtime use; do not bypass wrappers | Maven and relevant JDK/Kotlin/framework official docs |

Other ecosystems, Gradle-specific behavior, unusual monorepos, generated build systems, and stale or
conflicting toolchains are explicitly unsupported until researched. Record what evidence is
missing, what official source must be checked, and which decision depends on it.

## Initializer and configuration discipline

For `new`, record the selected initializer, intended version/channel, requested non-default flags,
network effects, expected generated structure, and verification plan before it runs. Recheck current
official documentation when behavior or versions may have changed. For `retrofit`, prefer native
incremental configuration and preserve the existing package manager, wrappers, formatting style,
module boundaries, and generated files unless an approved specification says otherwise.
