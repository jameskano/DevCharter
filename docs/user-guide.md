# DevCharter v0: Complete User Guide

> Applies to DevCharter `0.1.0`. This guide is maintained with the product source so documentation
> changes can be reviewed alongside behavior changes.

DevCharter is a local command-line tool that examines a software repository and proposes the
smallest useful set of governance, engineering, and AI-development foundations for that repository.
It is designed for developers and small teams working with AI coding tools, especially Codex, who
want repository-specific instructions and verification without accumulating unnecessary agents,
prompts, hooks, or configuration.

DevCharter's defining promise is:

> Give a repository the smallest, safest, and most useful AI development system it actually needs.

The important word is _proposes_. Discovery, audits, proposals, and rendering are read-only. A change
is written only after two distinct, fingerprint-bound approvals: one for the abstract proposal and
another for the exact rendered content.

## Contents

- [1. Product status](#1-product-status)
- [2. What DevCharter does](#2-what-devcharter-does)
- [3. What DevCharter does not do](#3-what-devcharter-does-not-do)
- [4. Core workflow and mental model](#4-core-workflow-and-mental-model)
- [5. Requirements and installation](#5-requirements-and-installation)
- [6. Choosing a mode](#6-choosing-a-mode)
- [7. Choosing a scope](#7-choosing-a-scope)
- [8. Quick starts](#8-quick-starts)
- [9. Complete command reference](#9-complete-command-reference)
- [10. Decision files](#10-decision-files)
- [11. Proposal and approval contracts](#11-proposal-and-approval-contracts)
- [12. Rendering and generated output](#12-rendering-and-generated-output)
- [13. Applying changes safely](#13-applying-changes-safely)
- [14. Understanding analysis results](#14-understanding-analysis-results)
- [15. Discovery and fingerprinting](#15-discovery-and-fingerprinting)
- [16. Validation](#16-validation)
- [17. Optional configuration](#17-optional-configuration)
- [18. Built-in Codex skills](#18-built-in-codex-skills)
- [19. Programmatic packages](#19-programmatic-packages)
- [20. Troubleshooting](#20-troubleshooting)
- [21. Limits and caveats](#21-limits-and-caveats)
- [22. Recommended operating practices](#22-recommended-operating-practices)
- [23. Source map](#23-source-map)

## 1. Product status

DevCharter is currently a technically qualified v0 implementation with package version `0.1.0`.
The repository records successful qualification on Node.js 22 and 24 across Ubuntu, Windows, and
macOS, including tests of freshly installed local tarballs. The repository's release documentation
records 415 unit/integration tests and 25 release tests passing in the qualifying CI run.

It is not yet a conventional public package release:

- the workspace root is private;
- the three runtime packages are installed together from locally built `.tgz` files;
- registry publication and namespace reservation are deferred;
- publishing automation is deferred;
- the legal license choice is deferred, and the repository currently contains no `LICENSE` file;
- the changelog still labels the current work as `Unreleased`.

In practical terms, new users can evaluate and use DevCharter from source and qualified local
tarballs, but should not treat `0.1.0` as a registry-supported, legally licensed public distribution.
See the [release qualification record](release/v0-qualification.md) and
[changelog](../CHANGELOG.md).

## 2. What DevCharter does

DevCharter can:

- inventory a repository without changing it;
- recommend whether the repository should use the `new` or `retrofit` workflow;
- audit governance, engineering, AI-development configuration, or all three;
- distinguish confirmed facts, inferences, assumptions, questions, conflicts, and risks;
- find broken documentation references and specification relationships;
- compare documented or CI commands with repository command authorities;
- identify missing verification and critical-journey evidence in established projects;
- recognize native Codex instruction layering through `AGENTS.md` and
  `AGENTS.override.md`;
- distinguish developer-AI configuration from runtime/product AI evidence;
- recognize supported third-party skill-provenance records;
- propose one decision per target path: `create`, `update`, `skip`, or `conflict`;
- render approved proposals into complete content or full-file diffs with the Codex adapter;
- apply exactly approved content with containment, stale-state, and baseline checks;
- track explicitly managed outputs in `.devcharter/managed-files.json`;
- validate configuration, deterministic repository integrity, and managed-output integrity;
- make an exact repeat of a successful apply return `already-applied` when the surrounding
  repository state can be proven unchanged.

The product is intentionally conservative. A good result may be a no-op or the preservation of an
existing `README.md`, `package.json`, or `AGENTS.md`. More generated files are not considered a
better result.

## 3. What DevCharter does not do

DevCharter v0 is not:

- an AI agent runtime or orchestrator;
- a project-management system, task board, or issue tracker;
- a hosted service;
- a session store, chat-memory system, or vector database;
- a worktree, terminal, or sandbox manager;
- a provider router or centralized policy service;
- a prompt, plugin, or skill marketplace;
- an automatic pull-request or protected-branch writer;
- an autonomous product owner;
- a continuous semantic repository monitor.

It also does not execute arbitrary commands discovered in a repository. Its command analysis is
static and deliberately bounded. The optional `.devcharter.yaml` can list verification commands, but
v0 validates and preserves those declarations rather than executing them.

## 4. Core workflow and mental model

The full lifecycle is:

```text
discover -> understand -> answer -> propose -> approve -> render -> approve -> apply -> verify
```

There are four important artifacts:

1. **Decision file** — answers material questions returned by `new` or `retrofit`.
2. **Proposal** — an abstract, unapproved plan bound to a proposal fingerprint and a scoped
   repository fingerprint. It describes intentions but not necessarily final file contents.
3. **Rendered plan** — the exact content or diff for every target, bound to a rendered fingerprint.
4. **Managed receipt** — optional operational metadata recording DevCharter-managed file paths,
   adapters, and baseline hashes after application.

There are also two deliberately separate approvals:

```text
Abstract approval: "I accept this proposal and its target decisions."
Write approval:    "I accept these exact rendered contents/diffs."
```

Neither approval is stored as a session. Each is a small JSON file that contains explicit
confirmation and fingerprints copied from the immediately preceding artifact. If relevant
repository state changes, the next stage fails rather than silently applying stale intent.

All commands operate on the current working directory. DevCharter does not accept a positional
repository path, so change into the target repository before running it.

## 5. Requirements and installation

### Supported environment

- Node.js 22 or later. The qualified matrix covers Node 22 and 24.
- pnpm 10; the repository pins `pnpm@10.18.3`.
- Git is optional for non-Git directories, but Git facts strengthen mode recommendations,
  fingerprints, and stale-state protection.
- No network or telemetry is required by core runtime behavior after installation.

### Clone and build DevCharter

```bash
git clone https://github.com/jameskano/DevCharter.git
cd DevCharter
corepack enable
pnpm install --frozen-lockfile
pnpm build
```

### Build the three local packages

Run these commands from the DevCharter repository root:

```bash
mkdir release-artifacts
pnpm --dir packages/core pack --pack-destination ../../release-artifacts
pnpm --dir packages/adapter-codex pack --pack-destination ../../release-artifacts
pnpm --dir packages/cli pack --pack-destination ../../release-artifacts
```

This creates three versioned tarballs:

- `devcharter-core-0.1.0.tgz`
- `devcharter-adapter-codex-0.1.0.tgz`
- `devcharter-cli-0.1.0.tgz`

### Install into a target repository

From the target repository, install all three tarballs together. Adjust the paths to match where you
cloned DevCharter.

```bash
pnpm add ../DevCharter/release-artifacts/devcharter-core-0.1.0.tgz ../DevCharter/release-artifacts/devcharter-adapter-codex-0.1.0.tgz ../DevCharter/release-artifacts/devcharter-cli-0.1.0.tgz
pnpm exec devcharter --version
```

Expected output:

```text
devcharter 0.1.0
```

### Run inside the DevCharter workspace

Contributors can run the built CLI from the source workspace with:

```bash
pnpm devcharter audit --scope engineering --format json
```

### Optional package qualification

Maintainers can run the authoritative build, pack, fresh-install, asset, lifecycle, validation, and
exact-retry qualification harness with:

```bash
pnpm package:qualify
```

This is a release check, not a normal prerequisite for using the CLI.

## 6. Choosing a mode

| Mode       | Use it when                                                           | Writes? | Produces a proposal? |
| ---------- | --------------------------------------------------------------------- | ------- | -------------------- |
| `new`      | The repository is empty or lightly initialized and needs a foundation | No      | Yes                  |
| `retrofit` | The repository is established and existing material must be preserved | No      | Yes                  |
| `audit`    | You want findings and recommendations only                            | No      | No                   |

### `new`

`new` proposes a lightweight foundation from the intended outcome, technologies, constraints,
risks, and selected AI tools. It may infer enough information from substantive current documentation
and manifests to avoid unnecessary questions.

### `retrofit`

`retrofit` analyzes existing code, documentation, specifications, tests, CI, commands, and AI
configuration. It proposes targeted repairs or additions without blindly replacing useful
project-owned material.

### `audit`

`audit` returns the same evidence-oriented analysis sections as the proposal modes, but no proposal,
approval state, or planned changes. It is structurally read-only.

### Mode recommendation

`new` and `retrofit` still analyze repository maturity. Material source code, deployment
configuration, or substantial current documentation can support a `retrofit` recommendation. Tests,
a non-trivial manifest, application structure, and Git history provide supporting evidence. If the
evidence is ambiguous, DevCharter may ask for the `project.mode` decision.

## 7. Choosing a scope

Every proposal or audit mode supports one of four scopes. The default is `full`.

| Scope         | What it covers                                                                       |
| ------------- | ------------------------------------------------------------------------------------ |
| `full`        | Governance, engineering, and AI-development concerns                                 |
| `governance`  | Current project truth, documentation, specifications, decisions, and synchronization |
| `engineering` | Manifests, verification commands, tests, CI, safety, and development foundations     |
| `ai`          | `AGENTS.md`, skills, native tool configuration, and justified AI components          |

Architecture, security, privacy, accessibility, reliability, maintainability, performance, cost,
and operations are considerations inside applicable scopes. They are not additional CLI scopes.

Choose the narrowest scope that matches the goal. A narrower scope reduces the approval-relevant
fingerprint and avoids proposing unrelated work.

## 8. Quick starts

### A. Safest first look at an existing repository

```bash
cd path/to/target-repository
pnpm exec devcharter inspect
pnpm exec devcharter audit --scope full
pnpm exec devcharter validate
```

This inventories the repository, returns a full read-only assessment, and checks deterministic
integrity. None of these commands writes files.

For complete machine-readable evidence, add `--format json`.

### B. Audit only AI-development setup

```bash
pnpm exec devcharter audit --scope ai --format json
```

Use this when you want to review instruction routing, skills, prompts, possible duplication, and
developer-AI configuration without evaluating all engineering or governance concerns.

### C. Complete lifecycle for a new AI-only repository

Keep lifecycle files in a directory _outside_ the target repository:

```text
workspace/
├── lifecycle-inputs/
└── target-repository/
```

First create `lifecycle-inputs/decisions.json`:

```json
[
  { "id": "project.outcome", "value": "Ship a dependable local tool" },
  { "id": "project.aiTools", "value": ["Codex"] },
  { "id": "project.constraints", "value": [] },
  { "id": "project.risks", "value": [] }
]
```

Then run the proposal from the target repository:

```bash
cd target-repository
pnpm exec devcharter new --scope ai --decisions ../lifecycle-inputs/decisions.json --format json > ../lifecycle-inputs/proposal.json
```

Review `proposal.json`. Its successful envelope contains `result.proposal`, including `revision`,
`proposalFingerprint`, and `repositoryFingerprint`. Create
`lifecycle-inputs/abstract-approval.json` with those exact values:

```json
{
  "stage": "abstract",
  "confirmed": true,
  "proposalRevision": 1,
  "proposalFingerprint": "<copy from result.proposal.proposalFingerprint>",
  "repositoryFingerprint": "<copy from result.proposal.repositoryFingerprint>"
}
```

Render without writing:

```bash
pnpm exec devcharter render --proposal ../lifecycle-inputs/proposal.json --approval ../lifecycle-inputs/abstract-approval.json --adapter codex --format json > ../lifecycle-inputs/plan.json
```

Review every change, content body, full-file diff, baseline hash, and conflict in `plan.json`. Create
`lifecycle-inputs/write-approval.json` from `result.revision`, `result.renderedFingerprint`, and
`result.repositoryFingerprint`:

```json
{
  "stage": "write",
  "confirmed": true,
  "proposalRevision": 1,
  "renderedFingerprint": "<copy from result.renderedFingerprint>",
  "repositoryFingerprint": "<copy from result.repositoryFingerprint>"
}
```

Apply and validate:

```bash
pnpm exec devcharter apply --plan ../lifecycle-inputs/plan.json --approval ../lifecycle-inputs/write-approval.json --format json
pnpm exec devcharter validate --format json
git diff --check
git diff
```

### D. Retrofit an established repository

Start without decisions so DevCharter can report only the questions that repository evidence cannot
answer:

```bash
pnpm exec devcharter retrofit --scope full --format json > ../lifecycle-inputs/initial-proposal.json
```

Read `result.questions`, create a decision array using those IDs, and run again:

```bash
pnpm exec devcharter retrofit --scope full --decisions ../lifecycle-inputs/decisions.json --previous-proposal ../lifecycle-inputs/initial-proposal.json --format json > ../lifecycle-inputs/revised-proposal.json
```

Then follow the same abstract approval, render, write approval, apply, and validate stages shown
above.

The `--previous-proposal` file must use the same mode and scope and must still match repository state.
If accepted decisions materially change the proposal identity, the proposal revision increases.

## 9. Complete command reference

All commands support `--format human|json`; `human` is the default.

### Global actions

```text
devcharter --help
devcharter -h
devcharter --version
devcharter -v
```

`--version` cannot be combined with a command or another action.

### `inspect`

```text
devcharter inspect [--format human|json]
```

Recursively inventories the current directory and reports each artifact's path, kind, and origin.
It does not perform the full Project Architect analysis.

### `audit`

```text
devcharter audit [--scope full|governance|engineering|ai] [--format human|json]
```

Performs scoped discovery and analysis. It reports evidence-backed facts, findings, assumptions,
critical journeys, considered components, preserved paths, conflicts, risks, validation guidance,
and deferred work. It accepts neither `--decisions` nor `--previous-proposal`.

### `new`

```text
devcharter new [--scope full|governance|engineering|ai] [--decisions <file>] [--previous-proposal <file>] [--format human|json]
```

Produces an unapproved proposal for a new or lightly initialized repository. Unresolved required
questions prevent abstract approval.

### `retrofit`

```text
devcharter retrofit [--scope full|governance|engineering|ai] [--decisions <file>] [--previous-proposal <file>] [--format human|json]
```

Produces an unapproved proposal for an established repository, including explicit preservation and
conflict decisions.

### `render`

```text
devcharter render --proposal <file> --approval <file> --adapter codex [--format human|json]
```

Validates the proposal and abstract approval against the current repository, then renders exact
content or diffs. It remains read-only. `codex` is the only v0 adapter.

The proposal input can be either:

- a bare canonical proposal; or
- a complete successful JSON envelope from `new` or `retrofit` containing exactly one valid
  proposal.

### `apply`

```text
devcharter apply --plan <file> --approval <file> [--format human|json]
```

Validates the rendered plan, write approval, current repository fingerprint, target baselines, and
managed receipt before writing. The plan can be a bare rendered plan or a complete successful
`render` envelope.

### `validate`

```text
devcharter validate [--format human|json]
```

Runs three groups of checks:

1. optional `.devcharter.yaml` configuration;
2. legacy `.ai/*.yaml` detection and deterministic repository-integrity findings;
3. `.devcharter/managed-files.json` integrity, if a receipt exists.

Subjective recommendations such as missing verification or missing journey evidence do not
automatically fail validation. Validation itself is read-only.

### Exit codes

| Code | Meaning                                                                            |
| ---- | ---------------------------------------------------------------------------------- |
| `0`  | Successful command; for `validate`, no failing outcome                             |
| `1`  | Runtime, repository-state, approval, rendering, application, or validation failure |
| `2`  | Invalid CLI arguments or malformed lifecycle input                                 |

Automation should check both the process exit code and, for JSON output, the envelope's `ok` field.

## 10. Decision files

A decision file is a strict JSON array. Every item has an `id`, a JSON `value`, and optional evidence.

```json
[
  {
    "id": "project.outcome",
    "value": "Provide a local issue triage tool",
    "evidence": [{ "source": "product brief" }]
  }
]
```

Unknown IDs, duplicate IDs, invalid value types, and decisions irrelevant to a narrowed scope are
rejected.

| Decision ID              | Required value                                         | Purpose and applicability                                                                      |
| ------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `project.outcome`        | Non-empty string                                       | Desired product/repository outcome; may be used in any proposal scope                          |
| `project.technologies`   | Non-empty string array                                 | Technology selection; `full` or `engineering`                                                  |
| `project.aiTools`        | Non-empty string array                                 | Developer AI tools to support; `full` or `ai`                                                  |
| `project.constraints`    | String array; may be empty                             | Constraints that can affect architecture or preservation                                       |
| `project.risks`          | String array; may be empty                             | Risks that can affect safety or verification                                                   |
| `project.mode`           | `"new"` or `"retrofit"`                                | Resolves an ambiguous maturity recommendation; must match the invoked mode                     |
| `project.manifestPath`   | Safe forward-slash repository-relative path            | Selects an otherwise ambiguous engineering manifest; `full` or `engineering`                   |
| `project.packageScripts` | Non-empty object of script name to single-line command | Supplies exact verification scripts when DevCharter cannot infer them; `full` or `engineering` |

Example package-script decision:

```json
{
  "id": "project.packageScripts",
  "value": {
    "lint": "eslint .",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

Script names must be non-empty, trimmed, and free of control characters. The unsafe property names
`__proto__`, `prototype`, and `constructor` are rejected. Bodies must be nonblank, single-line
strings. DevCharter does not guess or run these commands when making the decision.

Constraints and risks are asked only when repository evidence makes them material. When no
contextual evidence exists, v0 uses explicit empty defaults rather than blocking approval with
generic questions.

## 11. Proposal and approval contracts

### Successful JSON envelope

Commands use a stable outer envelope:

```json
{
  "formatVersion": 1,
  "command": "retrofit",
  "ok": true,
  "result": {},
  "warnings": [],
  "errors": []
}
```

When `ok` is false, `errors` contains structured records with a code, message, and optional path or
details.

### Proposal contents

An `EcosystemProposal` contains:

- mode and scope;
- repository fingerprint and proposal fingerprint;
- revision and `approved: false` at the CLI boundary;
- facts, assumptions, accepted decisions, and unresolved questions;
- findings and conflicts;
- desired outcome and critical journeys;
- considered components;
- planned changes and preserved paths;
- risks, validation expectations, and deferred work.

Every target appears at most once. When multiple reasons affect the same path, they are merged and
the dominant action follows this order:

```text
conflict > update > create > skip
```

### Abstract approval

```json
{
  "stage": "abstract",
  "confirmed": true,
  "proposalRevision": 1,
  "proposalFingerprint": "<64-character SHA-256 value>",
  "repositoryFingerprint": "<64-character SHA-256 value>"
}
```

Approval fails when:

- required questions remain unresolved;
- the proposal has no actionable target decision;
- a fingerprint or revision does not match;
- the repository changed in approval-relevant ways;
- the proposal was materially edited after generation;
- the input tries to approve an audit result.

### Write approval

```json
{
  "stage": "write",
  "confirmed": true,
  "proposalRevision": 1,
  "renderedFingerprint": "<64-character SHA-256 value>",
  "repositoryFingerprint": "<64-character SHA-256 value>"
}
```

An abstract approval cannot be reused as write approval. The second approval binds the user to the
exact rendered plan, including content, diffs, actions, conflicts, and metadata.

## 12. Rendering and generated output

Rendering is deterministic and read-only. The rendered plan records, for each change:

- target path and final action;
- purpose, reason, origin, and ownership;
- adapter ID;
- whether the target is expected to be present or absent;
- baseline and proposed-content hashes;
- exact proposed content for creates;
- a full-file before/after review diff for updates;
- validation expectations;
- managed state or conflict detail when applicable.

### Codex adapter behavior

The v0 adapter can render:

- `.agents/skills/project-architect/SKILL.md` from its packaged skill asset;
- `.agents/skills/specification-architect/SKILL.md` from its packaged skill asset;
- root or nested `AGENTS.md` files;
- strict-JSON `package.json` files;
- other Markdown targets through a small deterministic template.

For `AGENTS.md`, the adapter creates concise repository instructions from the accepted desired
outcome and a preservation/verification workflow. When an existing file is being updated, it appends
the new body only if that body is not already present.

For `package.json`, the adapter requires `project.packageScripts` when engineering analysis cannot
infer a sufficient verification surface. A new manifest contains only the accepted `scripts`
object. An existing manifest must be strict, unambiguous JSON; comments, trailing commas, duplicate
root properties, duplicate script properties, or malformed JSON cause a rendering conflict. The
adapter preserves unrelated fields, indentation, line endings, and the order of existing scripts,
then adds new accepted script names in sorted order.

For other Markdown files, the deterministic template contains a title derived from the target's
purpose, the desired outcome, and the maintenance implication. This generic renderer may be too
coarse for a specialized document; review the output and reject it when it would not genuinely
resolve the finding.

If no deterministic recipe exists, the target becomes a `conflict` rather than receiving guessed
content.

## 13. Applying changes safely

`apply` is the only CLI command that loads the writer-capable package path.

Before the first write it checks all targets for:

- duplicate target paths, case-insensitively on Windows;
- unresolved rendered conflicts;
- expected presence or absence;
- unchanged baseline content;
- a well-formed and unchanged managed-output receipt;
- matching approval and plan fingerprints;
- matching scoped repository state.

If preflight finds any problem, no target is written and every target receives a terminal result.

Writes use a temporary file in the destination directory, flush it, recheck the target precondition,
and atomically rename it over the target. Paths must stay inside the repository and cannot traverse
symbolic-link segments.

Possible per-target outcomes are:

- `created`
- `updated`
- `skipped`
- `conflict`
- `failed`
- `not-attempted`

Overall outcomes are `applied`, `already-applied`, or `failed`.

There is no transaction-wide rollback. If a low-level failure occurs after earlier files were
written, DevCharter reports those successful writes, marks the failed target, and marks later writes
`not-attempted`. Review `changedPaths` and the working-tree diff after every apply.

### Managed receipt

When a rendered change is explicitly `devcharter-managed`, application may create or update:

```text
.devcharter/managed-files.json
```

The version-1 receipt records the path, adapter, resulting baseline hash, and `managed: true` for each
managed file. `validate` later compares each managed file with this baseline. Missing, malformed, or
drifted ownership metadata causes a conflict instead of silent adoption or overwrite.

Starter documentation is normally project-owned after application, so developers can maintain it
normally. The receipt is for files explicitly declared managed, not every file DevCharter touches.

### Exact retry

Repeating the same approved apply can return `already-applied` with zero changed paths only when:

- every writable target already matches the rendered hash;
- the managed receipt, if any, matches exactly;
- the retry-state capture was exact;
- all other bounded repository and Git state matches the rendered plan's retry digest;
- there were no unresolved conflicts.

Unreadable, binary, secret-like, oversized, unsupported, or otherwise uncertain surrounding state
makes the capture inexact. In that case DevCharter requires a fresh proposal and approval rather than
claiming a safe no-op.

## 14. Understanding analysis results

### Facts

Facts have a key, JSON value, state, evidence, and—when inferred—confidence:

- `confirmed`: directly supported by repository or process evidence;
- `inferred`: evidence-backed but not explicit; includes `low`, `medium`, or `high` confidence;
- `assumed`: a conservative, reversible default.

Examples include repository root, artifact count, detected technologies, instruction authorities,
selected AI tools, runtime-AI implementation evidence, and unused or unconfirmed AI dependencies.

### Findings

Findings include a stable code, summary, evidence, scope, impact, confidence, recommended action, and
optional uncertainty or question.

Current finding codes include:

| Area                      | Finding codes                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| References/specifications | `BROKEN_REFERENCE`, `BROKEN_SPEC_RELATIONSHIP`, `DUPLICATE_SPEC_ID`, `SPEC_PRECEDENCE_CONFLICT`, `SPEC_STATUS_PATH_CONFLICT`                                  |
| Commands/manifests        | `INVALID_MANIFEST`, `COMMAND_AUTHORITY_AMBIGUOUS`, `COMMAND_VALIDATION_UNCERTAIN`, `DOCUMENTED_COMMAND_MISSING`, `CI_COMMAND_MISSING`, `MISSING_VERIFICATION` |
| AI configuration          | `DUPLICATE_AI_MATERIAL`, `INSTRUCTION_ROUTING_CONFLICT`, `UNJUSTIFIED_AI_COMPLEXITY`, `SKILL_PROVENANCE_INVALID`                                              |
| Ownership/journeys        | `UNKNOWN_GENERATED_OWNERSHIP`, `MISSING_CRITICAL_JOURNEY_EVIDENCE`                                                                                            |

Not every finding is a validation failure. Some are recommendations or intentionally low-confidence
uncertainties.

### Conflicts

The following findings are also treated as conflicts in proposals:

- `COMMAND_AUTHORITY_AMBIGUOUS`
- `DUPLICATE_AI_MATERIAL`
- `DUPLICATE_SPEC_ID`
- `INSTRUCTION_ROUTING_CONFLICT`
- `SPEC_PRECEDENCE_CONFLICT`
- `SPEC_STATUS_PATH_CONFLICT`
- `UNKNOWN_GENERATED_OWNERSHIP`

A conflict takes precedence over create, update, or skip and must be resolved before application.

### Critical journeys

DevCharter tries to identify the smallest workflows that verification should protect. Developer
journeys prefer, in order:

1. a root aggregate `verify` or `check` command;
2. configured CI;
3. another root verification command;
4. independently maintained package-level commands.

User journeys require explicit current-documentation headings or E2E test titles. DevCharter does
not invent product journeys from source names. At most 12 journeys are returned.

### Preserved paths

The JSON result contains the complete list of project-origin paths to preserve. Human output shows at
most 20 and tells you how many additional paths were omitted from the preview.

## 15. Discovery and fingerprinting

### Artifact classification

DevCharter recognizes source and test material for:

- JavaScript and TypeScript;
- Python;
- Rust;
- Go;
- Java;
- Kotlin.

It also classifies documentation, configuration, generated output, caches, dependencies, symbolic
links, and unknown files.

The following conventional directories are treated specially:

- dependencies: `.pnpm`, `.venv`, `.yarn`, `bower_components`, `node_modules`, `Pods`, `venv`;
- caches: `.cache`, `.gradle`, `.mypy_cache`, `.nox`, `.pytest_cache`, `.ruff_cache`, `.tox`,
  `.turbo`;
- generated output: `.next`, `.nuxt`, `.output`, `.typecheck`, `build`, `coverage`, `dist`, `out`,
  `target`.

A root `vendor` directory is a dependency boundary. A nested `vendor` is excluded only when its
parent has a recognized package-root manifest; otherwise it remains project material. Installed
skill directories are still inventoried so provenance can be evaluated.

### Scope selection

Files are assigned governance, engineering, and/or AI roles. Selected-scope files are fully bound to
the scoped repository fingerprint. Some additional source, test, manifest, documentation, and
deployment paths contribute a coarse mode-classification digest so repository maturity can be
assessed without hashing every out-of-scope body.

References from selected text can pull referenced project files into the fingerprint as explicit
reference dependencies.

### Content limits and exclusions

- Files up to 1 MiB can participate in semantic inspection.
- Text files up to 4 MiB can be fully hashed for proposal fingerprints.
- A NUL byte in the first 8 KiB causes binary classification.
- Common binary extensions are excluded from semantic content analysis.
- Secret-like paths such as `.env*`, credentials files, private keys, keystores, `.ssh`, `.aws`,
  `.azure`, `.gnupg`, and `secrets` directories are excluded.
- Symbolic-link targets are never followed during proposal analysis.
- Unsupported, unsafe, unreadable, and oversized entries are recorded as exclusions; relevant
  uncertainty becomes visible rather than being ignored.

Fingerprint algorithm version 2 includes canonical metadata about approval-relevant exclusions but
does not hash their contents.

### Git facts

When contained `.git` metadata is available, DevCharter reads a bounded set of facts with prompts,
optional locks, fsmonitor, and untracked cache disabled:

- repository root;
- current `HEAD` commit, if one exists;
- a history count capped at two for maturity corroboration;
- selected-scope working-tree status;
- selected-scope tracked/untracked path identity.

Git operations have a five-second timeout and a one-megabyte output limit. Git history supports but
does not by itself override stronger repository evidence.

### Static command authority

DevCharter validates a deliberately limited command set:

- npm, pnpm, yarn, and bun scripts against the applicable `package.json`;
- static Python project/tool declarations and common `pytest`, `ruff`, and `mypy` forms;
- standard Cargo, Go, and Maven verification commands.

Workspace/package selectors are considered when they can be resolved deterministically. Dynamic,
plugin-provided, unfamiliar, or ambiguous commands produce uncertainty instead of guessed shell
semantics.

### Runtime-AI evidence

An AI-looking dependency alone is not enough to claim that the product implements runtime AI.
DevCharter combines supported dependency declarations with active production-source imports. Test
imports, comments, strings, examples, and developer-AI configuration do not establish runtime-AI
implementation. A declared dependency without a matching production import remains unused or
unconfirmed.

### Third-party skill provenance

Project-local skills are treated as project-authored unless an explicit local marker or an
unambiguous version-1 `skills-lock.json` record maps the entry to a specific
`.agents/skills/<name>` directory. Both DevCharter-style and supported installer-style lock entries
are recognized. Invalid entries fail conservatively on an entry-by-entry basis; unrelated valid
entries remain usable. Installer hashes are treated as provenance metadata, not independently
verified content integrity.

Confirmed third-party skills remain visible in inventory but are excluded from project truth,
findings, recommendations, references, and content fingerprints.

## 16. Validation

`validate` composes deterministic checks rather than rerunning every subjective recommendation as a
failure.

### Failing repository-integrity findings

- `BROKEN_REFERENCE`
- `BROKEN_SPEC_RELATIONSHIP`
- `CI_COMMAND_MISSING`
- `COMMAND_AUTHORITY_AMBIGUOUS`
- `DOCUMENTED_COMMAND_MISSING`
- `DUPLICATE_SPEC_ID`
- `INSTRUCTION_ROUTING_CONFLICT`
- `INVALID_MANIFEST`
- `SKILL_PROVENANCE_INVALID`
- `SPEC_PRECEDENCE_CONFLICT`
- `SPEC_STATUS_PATH_CONFLICT`

### Warning-only repository-integrity findings

- `COMMAND_VALIDATION_UNCERTAIN`
- `UNKNOWN_GENERATED_OWNERSHIP`

### Other validation behavior

- A valid or absent `.devcharter.yaml` passes the configuration check.
- Legacy `.ai/*.yaml` files produce an explicit migration warning; malformed legacy YAML fails.
- A missing managed receipt is valid when there are no managed outputs to verify.
- A malformed receipt, missing managed target, or baseline-hash mismatch fails.
- `changedPaths` is always empty because validation is read-only.

Validation outcomes are `pass`, `warning`, or `fail`. A warning keeps the CLI envelope successful;
a failure makes `ok` false and exits with code 1.

## 17. Optional configuration

DevCharter can read a strict root `.devcharter.yaml`:

```yaml
version: 1
verificationCommands:
  - name: verify
    command: pnpm verify
  - name: e2e
    command: pnpm test:e2e
```

Rules:

- `version` must be exactly `1`;
- `verificationCommands` is optional and ordered;
- command names must match letters, digits, colon, underscore, and hyphen, beginning with a letter
  or digit;
- names must be unique;
- command bodies must be nonblank and single-line;
- unknown fields are rejected;
- exactly one YAML document is permitted;
- duplicate keys, aliases, merge keys, custom tags, and unsafe YAML features are rejected.

The file stores no secrets, conversations, sessions, rankings, capability matrices, receipts, or
generated-file state. In v0, these commands are accepted configuration authority but are not
executed.

## 18. Built-in Codex skills

The Codex adapter packages two skills. These are instruction assets for an AI coding tool, not new
CLI commands.

### Project Architect

The Project Architect skill routes repository ecosystem work through `new`, `retrofit`, or `audit`.
It instructs the AI to inspect before asking, use the deterministic command result as authority,
request only unresolved material decisions, preserve existing content, and respect both approval
gates.

### Specification Architect

The Specification Architect skill helps an AI:

- decide whether non-trivial work needs a specification;
- create one authoritative draft;
- refine an existing specification without inventing backward status transitions;
- review readiness, implementation gates, or completion evidence;
- separate facts, inferences, assumptions, decisions, rejected options, and open questions;
- write observable acceptance criteria and map them to verification;
- keep implementation, tests, and current documentation synchronized.

Its lifecycle is:

```text
draft -> ready -> active -> done
draft|ready|active -> cancelled
```

Only explicit human approval can move a draft to ready. Blocking, review severity, and validation
outcome are metadata rather than extra statuses. Specification Architect does not create sessions,
backlogs, role-agent fleets, persistence, networking, or a separate runtime API.

## 19. Programmatic packages

The local distribution contains three ESM packages:

### `@devcharter/core`

Public root exports include configuration parsing, canonical schemas/types, Project Architect APIs,
structured results/errors, safe YAML, and stable serialization. Additional read-only or lifecycle
subpaths are:

```text
@devcharter/core/read-only
@devcharter/core/project-architect
@devcharter/core/rendering
@devcharter/core/application
@devcharter/core/writer
```

Use `read-only` for code that must not acquire a writer dependency. The main analysis entry point is
`runProjectArchitect(root, request)`, where the request contains `mode`, optional `scope`, optional
accepted decisions, and an optional previous proposal.

All core operations return a discriminated result:

```ts
type Result<T> = { ok: true; value: T } | { ok: false; error: DevCharterErrorRecord };
```

### `@devcharter/adapter-codex`

Exports the deterministic `codexAdapter` and `loadPackagedSkill(name)` for the two built-in skill
assets.

### `@devcharter/cli`

Exports `runCli(args, io)` and version metadata. The binary entry point is `devcharter`.

The programmatic contracts are runtime-validated with Zod and are strict: extra or malformed fields
are rejected.

## 20. Troubleshooting

### “Required proposal questions remain unresolved”

Read `result.questions` from the latest `new` or `retrofit` JSON output. Create a decision array with
the requested IDs, rerun the same mode and scope, and pass the earlier proposal through
`--previous-proposal` if you want the revision contract continued.

### “Proposal approval does not match current proposal state” or `STALE_PROPOSAL`

The proposal, approval, or repository changed. Regenerate the proposal from the current repository,
review it, and create a new abstract approval. Do not edit fingerprints manually.

### “Repository state no longer matches the rendered plan”

Something changed after rendering. Preserve the external change, rerun the proposal and approvals,
and render again. Do not try to bypass the state check.

### `package.json rendering requires the approved project.packageScripts decision`

Add the exact intended script mapping to the decision file and regenerate the proposal. DevCharter
will not invent script bodies.

### `package.json is malformed or ambiguous`

The adapter accepts strict JSON only. Remove comments, trailing commas, duplicate keys, or other
ambiguity through a separately reviewed project change, then regenerate. Do not approve a generic
rewrite merely to make the file parse.

### Managed-output drift

If `validate` says a managed file drifted, decide whether the current file or the recorded managed
baseline is authoritative. Regenerate a proposal after resolving ownership. Do not delete or rewrite
the receipt just to suppress the conflict.

### Legacy `.ai/*.yaml` warning

Legacy AI YAML is intentionally not rewritten or deleted automatically. Use a reviewed `retrofit`
proposal and make an explicit migration decision.

### Human output appears incomplete

Human output previews only the first 20 preserved paths. Use `--format json` for complete evidence
and lifecycle automation.

### `COMMAND_VALIDATION_UNCERTAIN`

The command may be dynamic, plugin-provided, or outside the bounded parser. Establish a clear native
manifest authority or document the command explicitly. Treat the finding as a prompt for human
review, not proof that the command is invalid.

### Node version error

Use Node.js 22 or 24. Node 20 is below the supported product baseline even though historical local
development evidence was recorded on it.

### Registry package cannot be found

That is expected for the inspected v0 snapshot. Build and install all three local tarballs together.
Registry publication is deferred.

### Common structured error codes

| Code                  | Typical meaning                                                                   |
| --------------------- | --------------------------------------------------------------------------------- |
| `INVALID_ARGUMENT`    | Unsupported CLI option, malformed JSON contract, or invalid lifecycle combination |
| `INVALID_CONFIG`      | Invalid configuration, receipt, managed output, or deterministic integrity state  |
| `UNSAFE_YAML`         | YAML uses invalid or intentionally disallowed constructs                          |
| `PATH_OUTSIDE_ROOT`   | A path is absolute, malformed, or escapes the repository                          |
| `SYMLINK_ESCAPE`      | A path crosses a symbolic-link segment                                            |
| `READ_FAILED`         | A required file or root cannot be read                                            |
| `INVENTORY_FAILED`    | Recursive repository inventory could not complete                                 |
| `APPROVAL_REQUIRED`   | Approval is missing, invalid, or blocked by unresolved questions/no action        |
| `STALE_PROPOSAL`      | Proposal, plan, target baseline, receipt, or repository state has changed         |
| `ATOMIC_WRITE_FAILED` | Temporary write, flush, precondition check, rename, or cleanup failed             |

## 21. Limits and caveats

- Only the Codex adapter is implemented in v0.
- The Specification Architect is an instruction-only Codex skill, not a CLI command or runtime API.
- Package installation is local-tarball based; there is no registry release in this snapshot.
- No legal license has been selected in the repository.
- Static command recognition is intentionally limited and can produce false positives or
  uncertainty for natural-language examples, package-runner examples, plugins, and dynamic commands.
- The Habit Compass pilot recorded such command/reference noise and ultimately approved a no-write
  preservation outcome after rejecting six unsafe, external, false-positive, or unjustified
  proposed updates.
- Generic Markdown rendering may not be suitable for specialized imported documentation.
- DevCharter does not execute configured or discovered project verification commands.
- Semantic analysis is bounded; not every enumerated or fingerprinted file is semantically
  interpreted.
- Binary, secret-like, oversized, unsupported, and symlinked content is excluded conservatively.
- An inexact retry-state capture prevents `already-applied` even when the visible target files match.
- Application is not transactionally rolled back after a mid-write failure.
- Audit is deterministic and local, but heuristics are not a substitute for domain-owner review.
- v0 does not continuously monitor repository drift; rerun it when the repository or decisions
  materially change.

## 22. Recommended operating practices

1. Start with `inspect`, `audit`, and `validate` before considering writes.
2. Use `--format json` for complete evidence and reproducible automation.
3. Choose the narrowest useful scope.
4. Keep decisions, proposals, and approvals outside the target repository so their creation does not
   stale the target fingerprint.
5. Commit or deliberately preserve unrelated working-tree changes before a lifecycle when practical.
6. Answer only question IDs actually returned for the current repository and scope.
7. Never copy fingerprints from an older proposal or plan.
8. Review `conflict` and `update` targets path by path; a generated proposal is not automatically a
   good change.
9. Inspect every rendered content body or diff before creating write approval.
10. Run `validate`, repository-native checks, `git diff --check`, and a human diff review after apply.
11. Treat `already-applied` as a useful idempotency signal, not a reason to skip validation.
12. Preserve third-party material unless its ownership and safe update path are clear.
13. Record why proposed changes are rejected; a justified no-op is a successful DevCharter outcome.

## 23. Source map

This guide is derived from the repository's authoritative product, architecture, implementation, and
release sources:

- [Repository README and installed lifecycle](../README.md)
- [Product purpose and boundaries](product/purpose-and-scope.md)
- [Architecture, discovery, ownership, and writes](architecture/system-overview.md)
- [CLI implementation and command contract](../packages/cli/src/index.ts)
- [Canonical models and decision schemas](../packages/core/src/model.ts)
- [Repository inventory and path containment](../packages/core/src/repository.ts)
- [Project Architect analysis and proposal logic](../packages/core/src/project-architect.ts)
- [Rendering and approvals](../packages/core/src/rendering.ts)
- [Application and exact retry behavior](../packages/core/src/application.ts)
- [Codex adapter rendering recipes](../packages/adapter-codex/src/index.ts)
- [Release qualification evidence](release/v0-qualification.md)
- [Habit Compass preservation pilot](release/habit-compass-pilot.md)
- [Specification Architect skill](../.agents/skills/specification-architect/SKILL.md)
