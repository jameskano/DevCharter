# DevCharter system overview

## Architecture

```text
User or AI coding tool
        │
        ▼
Project Architect / Specification Architect
        │
        ▼
DevCharter deterministic core and CLI
        │
        ├── repository discovery
        ├── source-of-truth and reference analysis
        ├── proposal and approval contracts
        ├── safe file planning and application
        ├── Codex-native rendering
        └── validation and reporting
        │
        ▼
Target repository
```

## Current implementation status

SPEC-0001A implements the deterministic core foundation and the read-only `inspect` and `validate`
CLI commands. Completed SPEC-0001B adds scoped repository analysis, evidence-weighted mode
recommendations, explicit specification/command/instruction authority maps, bounded reference and
command validation, unapproved staged proposals, proposal/repository fingerprints, pure in-memory
approval, and the read-only `new`, `retrofit`, and `audit` commands. Completed SPEC-0001C implements
the model-neutral Specification Architect workflow as one instruction-only Codex repository skill,
without a parallel core API or CLI command. Completed SPEC-0001D adds a read-only rendering subpath, a
separate writer-capable application subpath, and the Codex adapter; release qualification remains
assigned to SPEC-0001E.

The CLI depends on read-only core entry points except after `apply` has been parsed. Only that branch
dynamically loads the application subpath that imports the separately exported atomic writer.
Rendering captures a compact versioned retry digest without importing the writer. The digest hashes
bounded readable files, records metadata for excluded or unsupported entries, and includes explicit
Git state built through the same read-only, prompt-disabled Git invocation used by discovery. Target
files, the managed receipt, and their ordinary parent directories do not make a successful apply look
stale. Any uncertainty marks the capture inexact and prevents an `already-applied` result.
Application also rechecks each target and receipt baseline immediately before atomic replacement, so
a change made after aggregate preflight is preserved and reported as stale instead of overwritten.

The optional `.devcharter.yaml` currently persists only schema version `1` and an ordered `verificationCommands` sequence. These commands cannot be selected reliably when scripts, CI, and documentation disagree, so DevCharter validates and preserves an accepted sequence but does not execute it in SPEC-0001A. Unknown fields are rejected. The file stores no secrets, conversations, sessions, rankings, capability matrices, receipts, or generated-file state.

## Responsibilities

### Project Architect

Runs `new`, `retrofit`, and `audit`. It discovers the repository, identifies relevant unknowns,
assesses only the selected scope, reports ambiguous authority rather than selecting it silently,
and produces a minimum-sufficient proposal or read-only audit report.

New and retrofit proposals contain abstract `PlannedFileChange` records without rendered content,
diffs, or adapters. Required decisions are validated and must resolve every blocking question before
approval. Each target has one create/update/skip/conflict decision, with conflict taking precedence,
and skip is used only for relevant, non-placeholder content that satisfies the target's authority
requirements. An inadequate existing target is updated rather than skipped. Proposals are always unapproved at the CLI
boundary. Approval binds explicit confirmation to the proposal revision, complete proposal
fingerprint (including conflicts), and current scoped repository fingerprint without persisting
state; audit proposals are invalid. Audit returns meaningful analysis through the complete stable
result contract, but no proposal, approval state, or planned changes. All three modes are
structurally unable to import the writer.

An engineering proposal that needs a missing or inadequate `package.json` verification surface asks
for the exact `project.packageScripts` mapping as an approval-blocking decision. The decision accepts
normal npm script punctuation and shell syntax while rejecting unsafe property names, blank names or
bodies, control characters, and multiline bodies. The Codex adapter either creates the minimal
manifest containing those scripts or performs a strict-JSON surgical update that preserves unrelated
manifest content and existing script order.

### Specification Architect

Creates or refines one definitive, implementation-ready specification for non-trivial behavior. It connects intent, acceptance criteria, implementation, tests, and documentation.

In v0 this is a repository skill at `.agents/skills/specification-architect/SKILL.md`. Codex performs
the semantic inspection, questioning, drafting, and review procedure using repository evidence. The
deterministic core keeps its existing neutral records and Project Architect authority analysis; no
runtime Specification Architect consumer currently justifies another public schema or package API.

### Deterministic core

Owns path safety, file discovery, structured validation, artifact classification, stable serialization, change planning, atomic application, reference checks, idempotency, and machine-readable results. It does not make product decisions.

### Codex adapter

Translates accepted canonical knowledge into Codex-native files. It does not create a second source of truth.

## Discovery model

Discovery recursively inventories paths while classifying generated output, caches, build artifacts,
conventional dependency/vendor directories, installed skills, project-authored material, and
unknown-origin files. Ambiguous project source directories named `vendor` remain project material
unless their repository position or stronger provenance establishes a dependency boundary. A root
`vendor` directory is conventional dependency material; a nested one requires an applicable parent
manifest before it is excluded.
Skill provenance is resolved before semantic inspection and fingerprinting. A project-local skill
is project-authored unless an explicit local marker or an unambiguous version-1 `skills-lock.json`
entry maps it to a specific `.agents/skills/<name>` directory; invalid or ambiguous lock data is
reported conservatively. Explicitly third-party skills remain inventoried but cannot contribute
project truth or fingerprint content.

Relevant content is then inspected to build:

- project facts with evidence and confidence;
- a source-of-truth map;
- existing specification, command, instruction, and skill authority/routing;
- spec precedence and supersession relationships;
- available verification commands and their CI coverage;
- critical developer and user journeys;
- conflicts, gaps, duplication, and unnecessary complexity.

Enumeration, safe text loading, fingerprinting, and semantic analysis are separate. A source used
only for hashing or mode classification is not reported as semantically inspected. Fingerprint
algorithm version 2 canonically binds approval-relevant oversized, unsafe, unsupported, and
external-symlink exclusion metadata while never hashing excluded contents.

Source and test classification covers JavaScript/TypeScript, Python, Rust, Go, Java, and Kotlin,
while known tool configuration such as `eslint.config.js` remains configuration rather than
application source. Establishment recommendations use explicit evidence rules: material source,
deployment configuration, or substantive current documentation can establish retrofit; Git history
only corroborates other evidence. Historical specifications, prompts, references, and generated
configuration code do not count as current implementation signals.

Markdown reference discovery covers links, reference definitions, native instruction paths, and
path-only inline code outside fenced examples. Existing inline targets can extend the scoped
fingerprint; missing inline targets are findings only when the surrounding prose expresses
reference intent, avoiding false findings for optional mechanism names.

Runtime-AI classification uses bounded authoritative dependency declarations and active production
source imports across package.json, Python, Cargo, Go, and Maven projects, including Java and Kotlin
sources. The repository artifact classifier supplies production and test paths; test-only imports,
comments, strings, and other inactive examples cannot establish product implementation. Python
dependencies are limited to supported PEP 621 and Poetry sections, and a small ecosystem-specific
registry maps exact dependency identities to supported import identities. A declared dependency
without matching production evidence remains unused or unconfirmed; developer-AI configuration is
classified independently. Maven authority is deliberately limited to direct `dependency` children
of the root project's direct `dependencies` element. Comments, CDATA, dependency management,
build/reporting plugins, profiles, arbitrary nesting, and `test` or `import` scopes cannot establish
runtime-AI dependency evidence; malformed or ambiguous XML produces no Maven evidence. The same
canonical matcher binds AI-scoped mode-classification source fingerprints to authoritative
production matches, so fact changes stale approval without treating unrelated source or test
bodies as complete AI-scope inputs.

Command authority is deliberately small and deterministic. It validates npm, pnpm, yarn, and bun
scripts against the applicable `package.json`; static Python script/tool declarations against
`pyproject.toml`; and bounded standard Cargo, Go, and Maven verification commands against their
native manifests. Dynamic or unfamiliar commands produce uncertainty rather than guessed shell
semantics. Codex instruction authority follows native directory layering, with
`AGENTS.override.md` replacing `AGENTS.md` in the same directory without being reported as a
conflict. Developer journeys prefer a documented/configured aggregate workflow, then CI, then a
root verification command; package workflows are used only when independently maintained. User
journeys require explicit current documentation or E2E test titles. Established repositories with
no such evidence receive a journey gap, while genuinely new repositories may report none.

For new repositories, accepted decisions take precedence over inference. A substantive current
purpose or outcome section may resolve the project outcome; placeholders, historical specs,
prompts, examples, and references may not. Empty constraints and risks become explicit defaults
when no contextual section or restrictive/failure statement raises them, rather than
approval-blocking questions. Considered
components are emitted only when repository evidence or an actual proposal decision makes them
relevant.

## Core records

The implementation needs small neutral contracts rather than many public schemas:

```text
ProjectFact
ArtifactRecord
Finding
EcosystemProposal
PlannedFileChange
ValidationResult
```

A planned file change contains at least:

```text
path
action: create | update | skip | conflict
purpose
reason
ownership/origin
dependencies and maintenance implication
validation expectations
optional content, diff, and adapter until rendering
```

Project Architect proposals use this abstract staged contract directly. The generator narrows it
before application so create/update changes contain reviewable rendered content or a diff.

## Persisted configuration

Do not require a forest of `.ai/*.yaml` files.

When durable, non-inferable project decisions are needed, prefer one compact root configuration such as `.devcharter.yaml`. Audit may run without creating it.

When DevCharter applies managed output, a small generated-file receipt may record paths, adapter, and baseline hashes for safe drift detection. It is operational metadata, not conversation or session state.

Existing earlier configuration files may be read and migrated only through an approved retrofit plan.

## Target implementation structure

A small workspace is preferred:

```text
packages/
├── core/
├── cli/
└── adapter-codex/

skills/
├── project-architect/
└── specification-architect/

templates/
tests/
├── fixtures/
├── integration/
└── e2e/
```

The current SPEC-0001A workspace contains only `packages/core` and `packages/cli`. Later packages, skills, templates, and broader test layers are created only by their active specifications. Do not restructure for cosmetic reasons.

## Write behavior

New and retrofit:

```text
inspect → ask only unresolved questions → propose → approve
→ plan create/update/skip/conflict → apply atomically → validate → report
```

Audit:

```text
inspect → assess → report
```

Audit never writes.

## Ownership

Starter documentation becomes project-owned after application unless a file is explicitly declared managed. DevCharter must not discourage normal project maintenance.

Mixed generated/project-maintained regions are exceptional. Prefer whole-file ownership, semantic updates, and reviewable diffs over protected markers or repeated appended sections.

## Network and vendors

Core v0 works offline and requires no telemetry. Canonical analysis is model-neutral. Adapters remain thin translations.

Application preflight collects all target conflicts and failures before the first write. Every target
and any planned managed receipt receives a terminal result. After a write failure, earlier successful
writes remain reported accurately and all remaining writes are `not-attempted`; DevCharter never
claims rollback it did not perform. Human and JSON lifecycle output expose the same target, receipt,
validation, changed-path, and failure facts.
