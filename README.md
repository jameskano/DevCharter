# DevCharter

[![CI](https://github.com/jameskano/DevCharter/actions/workflows/ci.yml/badge.svg)](https://github.com/jameskano/DevCharter/actions/workflows/ci.yml)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Version 0.1.0](https://img.shields.io/badge/version-0.1.0-4f46e5)](./CHANGELOG.md)

**Build the smallest AI-assisted development system your repository actually needs.**

DevCharter is a local, model-neutral CLI that examines a software repository, understands what is
already there, and proposes a focused development foundation for humans and AI coding tools. It
preserves useful conventions, exposes uncertainty, and requires review before it writes anything.

```text
discover -> understand -> answer -> propose -> approve -> render -> approve -> apply -> verify
```

DevCharter is for developers and small teams who want dependable repository instructions,
specifications, commands, tests, and AI-tool configuration without accumulating unnecessary agents,
prompts, hooks, or process.

## Why DevCharter

AI coding tools perform better when a repository clearly states what it does, how changes should be
made, and how those changes are verified. Building that system by hand is easy to overdo and hard to
keep consistent.

DevCharter takes a minimum-sufficient approach:

- inspects before asking questions or proposing files;
- distinguishes project-owned, third-party, generated, and unknown material;
- separates confirmed facts, inferences, assumptions, decisions, and open questions;
- maps documentation, specification, command, CI, instruction, and skill authority;
- preserves adequate existing files instead of replacing them;
- proposes one explicit `create`, `update`, `skip`, or `conflict` decision per target;
- shows complete content or diffs before application;
- binds both approvals to the current repository state;
- validates managed output and supports exact no-op retries.

A successful DevCharter run may create several useful foundations, improve one file, or preserve the
repository exactly as it is. More generated files are not considered a better result.

## What it can help establish

Depending on the repository and selected scope, DevCharter may propose or improve:

- a concise root `AGENTS.md`;
- current product and engineering documentation;
- an authoritative specification workflow;
- stable, repeatable Codex skills;
- repository-native verification commands;
- appropriate tests or CI foundations;
- a small amount of managed metadata for safe drift detection.

It does not generate role-agent fleets, prompt libraries, hooks, MCP integrations, CI, or new
tooling by default. Every component needs repository evidence or an accepted user decision.

## Quick start: inspect without writing

After installing the CLI, change into the repository you want to examine:

```bash
cd path/to/your-repository
pnpm exec devcharter inspect
pnpm exec devcharter audit --scope full
pnpm exec devcharter validate
```

These commands are read-only:

- `inspect` inventories the current directory;
- `audit` produces an evidence-backed assessment;
- `validate` checks configuration, deterministic repository integrity, and managed output.

Use JSON output for complete evidence or automation:

```bash
pnpm exec devcharter audit --scope engineering --format json
```

## Installation

DevCharter 0.1.0 supports Node.js 22 and later and uses pnpm 10. The current qualified distribution
is installed from three local tarballs: the deterministic core, Codex adapter, and CLI.

### 1. Build DevCharter

```bash
git clone https://github.com/jameskano/DevCharter.git
cd DevCharter
corepack enable
pnpm install --frozen-lockfile
pnpm build
```

### 2. Pack the runtime packages

Run from the DevCharter repository root:

```bash
mkdir release-artifacts
pnpm --dir packages/core pack --pack-destination ../../release-artifacts
pnpm --dir packages/adapter-codex pack --pack-destination ../../release-artifacts
pnpm --dir packages/cli pack --pack-destination ../../release-artifacts
```

### 3. Install them in the target repository

Adjust the paths to match your checkout:

```bash
cd ../target-repository
pnpm add ../DevCharter/release-artifacts/devcharter-core-0.1.0.tgz \
  ../DevCharter/release-artifacts/devcharter-adapter-codex-0.1.0.tgz \
  ../DevCharter/release-artifacts/devcharter-cli-0.1.0.tgz
pnpm exec devcharter --version
```

Expected output:

```text
devcharter 0.1.0
```

Registry publication is separate from the qualified v0 implementation. See
[Release status](#release-status) and the [release qualification record](docs/release/v0-qualification.md).

## Choose a mode

| Mode | Use it when | Writes during analysis? | Proposal produced? |
| --- | --- | --- | --- |
| `new` | The repository is empty or lightly initialized | No | Yes |
| `retrofit` | The repository is established and useful content must be preserved | No | Yes |
| `audit` | You want findings and recommendations only | No | No |

### New project

```bash
pnpm exec devcharter new --scope full --format json
```

`new` gathers or infers the intended outcome, technologies, constraints, risks, and selected AI
tools before proposing a lightweight foundation.

### Existing project

```bash
pnpm exec devcharter retrofit --scope full --format json
```

`retrofit` analyzes current code, documentation, specifications, commands, tests, CI, and AI
configuration, then proposes targeted improvements without blindly replacing conventions.

### Read-only assessment

```bash
pnpm exec devcharter audit --scope full --format json
```

`audit` returns facts, findings, conflicts, risks, critical journeys, preservation information, and
recommended actions, but no proposal or planned changes.

## Choose a scope

| Scope | Covers |
| --- | --- |
| `full` | Governance, engineering, and AI-development concerns |
| `governance` | Project truth, documentation, specifications, decisions, and synchronization |
| `engineering` | Manifests, commands, tests, CI, safety, and verification foundations |
| `ai` | Repository instructions, skills, and justified AI-tool configuration |

The default is `full`. Choose the narrowest scope that matches the desired outcome. Security,
privacy, accessibility, reliability, maintainability, performance, cost, and operations are
considered inside applicable scopes rather than exposed as additional scopes.

## Complete lifecycle

`new` and `retrofit` never write directly. They produce an unapproved abstract proposal. Applying a
change requires two independent approvals.

```text
1. Analyze repository       read-only
2. Answer material questions
3. Review abstract proposal
4. Approve proposal         fingerprint-bound
5. Render exact content     read-only
6. Review content and diffs
7. Approve rendered plan    independently fingerprint-bound
8. Apply                    the only writing stage
9. Validate and review diff
```

### 1. Supply accepted decisions

Create a JSON decision file using the question IDs returned by the first proposal. For an AI-only
new repository:

```json
[
  { "id": "project.outcome", "value": "Ship a dependable local tool" },
  { "id": "project.aiTools", "value": ["Codex"] },
  { "id": "project.constraints", "value": [] },
  { "id": "project.risks", "value": [] }
]
```

Keep lifecycle files outside the target repository so creating them does not change the repository
fingerprint.

```bash
pnpm exec devcharter new \
  --scope ai \
  --decisions ../devcharter-inputs/decisions.json \
  --format json > ../devcharter-inputs/proposal.json
```

### 2. Approve the abstract proposal

Copy the revision and fingerprints from `result.proposal` into a separate approval file:

```json
{
  "stage": "abstract",
  "confirmed": true,
  "proposalRevision": 1,
  "proposalFingerprint": "<proposal fingerprint>",
  "repositoryFingerprint": "<repository fingerprint>"
}
```

### 3. Render the exact plan

```bash
pnpm exec devcharter render \
  --proposal ../devcharter-inputs/proposal.json \
  --approval ../devcharter-inputs/abstract-approval.json \
  --adapter codex \
  --format json > ../devcharter-inputs/plan.json
```

Rendering remains read-only. Review every target, action, proposed content, full-file diff, baseline
hash, and conflict.

### 4. Approve the rendered plan

Copy the rendered values into a new write approval:

```json
{
  "stage": "write",
  "confirmed": true,
  "proposalRevision": 1,
  "renderedFingerprint": "<rendered fingerprint>",
  "repositoryFingerprint": "<repository fingerprint>"
}
```

### 5. Apply and verify

```bash
pnpm exec devcharter apply \
  --plan ../devcharter-inputs/plan.json \
  --approval ../devcharter-inputs/write-approval.json \
  --format json

pnpm exec devcharter validate --format json
git diff --check
git diff
```

If the repository, proposal, plan, target baseline, or managed receipt changes between stages,
DevCharter rejects the stale operation and requires a fresh review.

For the complete decision schema, approval contracts, examples, and troubleshooting, read the
[complete user guide](docs/user-guide.md).

## Command reference

All commands operate on the current working directory and support `--format human|json`.

```text
devcharter new [--scope full|governance|engineering|ai] [--decisions <file>] [--previous-proposal <file>] [--format human|json]
devcharter retrofit [--scope full|governance|engineering|ai] [--decisions <file>] [--previous-proposal <file>] [--format human|json]
devcharter audit [--scope full|governance|engineering|ai] [--format human|json]
devcharter inspect [--format human|json]
devcharter validate [--format human|json]
devcharter render --proposal <file> --approval <file> --adapter codex [--format human|json]
devcharter apply --plan <file> --approval <file> [--format human|json]
devcharter --help
devcharter --version
```

| Command | Purpose | Writes? |
| --- | --- | --- |
| `inspect` | Inventory paths, kinds, and origins | No |
| `audit` | Return a scoped evidence-backed assessment | No |
| `new` | Produce a foundation proposal for a new project | No |
| `retrofit` | Produce a preservation-aware proposal for an existing project | No |
| `render` | Turn an approved proposal into exact content and diffs | No |
| `apply` | Apply an exactly approved rendered plan | Yes |
| `validate` | Check configuration, repository integrity, and managed output | No |

Exit codes are `0` for success, `1` for a repository/lifecycle/validation failure, and `2` for
invalid arguments or malformed input.

## Safe by design

DevCharter treats repository modification as a reviewed operation, not a side effect of analysis.

- **Read-only first.** `inspect`, `audit`, `new`, `retrofit`, `render`, and `validate` do not write.
- **Two approvals.** Abstract intent and exact rendered content are approved separately.
- **Scoped fingerprints.** Approvals are bound to relevant repository content and Git state.
- **No silent overwrite.** Target presence and baseline hashes are checked before replacement.
- **Contained paths.** Absolute paths, parent traversal, and symbolic-link path segments are rejected.
- **Atomic file replacement.** Content is staged, flushed, rechecked, and renamed into place.
- **Conservative exclusions.** Secret-like, binary, oversized, unsupported, and unsafe material is not
  interpreted as ordinary project text.
- **No arbitrary command execution.** Discovered and configured commands are analyzed, not run.
- **No telemetry requirement.** Core runtime behavior works locally without a hosted service.
- **Explicit partial failure.** Successful earlier writes and later unattempted targets are reported;
  DevCharter never claims a rollback it did not perform.
- **Managed drift detection.** Explicitly managed output is tracked by path, adapter, and baseline hash.

An exact repeated apply returns `already-applied` with no changed paths only when the entire bounded
retry state can be proven unchanged.

## What DevCharter understands

### Repository ecosystems

Source and test discovery covers:

- JavaScript and TypeScript;
- Python;
- Rust;
- Go;
- Java;
- Kotlin.

### Command authority

Static command validation covers:

- npm, pnpm, yarn, and bun scripts;
- supported Python project/tool declarations and common verification tools;
- standard Cargo, Go, and Maven verification commands.

Dynamic, plugin-provided, unfamiliar, or ambiguous commands are reported as uncertainty rather than
interpreted through guessed shell behavior.

### AI configuration

DevCharter distinguishes:

- developer-AI instructions and workflows;
- runtime/product AI implementation;
- declared but unconfirmed AI dependencies;
- future AI ideas recorded only in specifications;
- project-authored and explicitly third-party skills.

An AI dependency alone is not enough to claim runtime AI. DevCharter requires supported dependency
authority and active production-source evidence.

### Native Codex behavior

The v0 Codex adapter can deterministically render:

- root and nested `AGENTS.md` files;
- strict-JSON `package.json` verification scripts from an explicit decision;
- the packaged Project Architect and Specification Architect skills;
- small Markdown foundations when the target justifies the generic recipe.

Unrenderable or ownership-ambiguous targets become conflicts instead of receiving guessed content.

## Built-in skills

DevCharter packages two Codex skills as production assets:

- **Project Architect** routes repository ecosystem work through `new`, `retrofit`, or `audit`, asks
  only material unresolved questions, and preserves both approval gates.
- **Specification Architect** helps create, refine, and review one authoritative specification for
  non-trivial behavior, with observable acceptance criteria and explicit readiness/completion gates.

The Specification Architect uses this lifecycle:

```text
draft -> ready -> active -> done
draft|ready|active -> cancelled
```

Only explicit human approval moves a draft to ready. Blocking and validation results are metadata,
not additional statuses.

## Documentation

- [Complete user guide](docs/user-guide.md) — installation, workflows, contracts, safety, output,
  configuration, APIs, and troubleshooting
- [Product purpose and scope](docs/product/purpose-and-scope.md)
- [System architecture](docs/architecture/system-overview.md)
- [Quality and decision model](docs/engineering/quality-and-decision-model.md)
- [Specification-driven workflow](docs/engineering/spec-driven-workflow.md)
- [v0 release qualification](docs/release/v0-qualification.md)
- [Habit Compass preservation pilot](docs/release/habit-compass-pilot.md)
- [Specification index](MANIFEST.md)
- [Changelog](CHANGELOG.md)

## Architecture

```text
User or AI coding tool
        |
        v
Project Architect / Specification Architect
        |
        v
Deterministic core and CLI
        |-- repository discovery
        |-- authority and reference analysis
        |-- proposal and approval contracts
        |-- safe rendering and application
        |-- validation and reporting
        v
Target repository
```

The workspace contains three runtime packages:

```text
packages/
|-- core/           model-neutral discovery, contracts, rendering, and safe application
|-- adapter-codex/  Codex-native rendering and packaged skill assets
`-- cli/            command parsing and human/JSON presentation
```

The CLI imports only read-only core surfaces until a validated `apply` command dynamically loads the
writer-capable application path.

## Development

Requirements:

- Node.js 22 or 24;
- pnpm 10.18.3 through Corepack.

Install and run the full local verification surface:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm test:release
pnpm package:qualify
pnpm devcharter validate --format json
pnpm test:audit-no-write
git diff --check
```

The CI matrix qualifies Ubuntu on Node 22 and 24, Windows on Node 24, and macOS on Node 24. It covers
formatting, linting, type checking, production builds, unit/integration tests, release journeys,
fresh tarball installation, deterministic self-validation, hostile audit no-write behavior, and
whitespace checks.

Non-trivial product changes are specification-driven. Read [AGENTS.md](AGENTS.md) and
[MANIFEST.md](MANIFEST.md) before implementation.

## Product boundaries

DevCharter is deliberately not:

- an AI agent runtime or orchestrator;
- a hosted service;
- a task board, issue tracker, or project-management platform;
- a session, memory, or vector database;
- a worktree, terminal, or sandbox manager;
- a prompt, plugin, or skill marketplace;
- an automatic pull-request or protected-branch writer;
- a provider router or universal policy server;
- a continuous semantic repository monitor.

These boundaries keep the product local, inspectable, model-neutral, and focused on repository
quality rather than infrastructure around the coding agent.

## Release status

DevCharter `0.1.0` is technically qualified for local installation through its three production
tarballs. The qualification includes fresh-installed CLI journeys, two approval gates, successful
application and validation, an exact retry no-op, cross-platform CI, and an independent completion
review.

Registry publication, package-namespace reservation, publishing automation, and legal license
selection remain release-administration decisions. They do not change the implemented v0 command or
safety contracts.

See [docs/release/v0-qualification.md](docs/release/v0-qualification.md) for the complete evidence.

## License

A legal license has not yet been selected. Until one is added, the repository does not grant the
standard permissions normally provided by an open-source license.
