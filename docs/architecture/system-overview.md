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

SPEC-0001A implements only the deterministic core foundation and the read-only `inspect` and `validate` CLI commands. Project Architect modes, Specification Architect workflows, generation, the Codex adapter, and release qualification remain assigned to SPEC-0001B–E.

The CLI depends only on the core read-only entry point. The atomic writer is a separately exported and tested primitive that neither current command can access.

## Responsibilities

### Project Architect

Runs `new`, `retrofit`, and `audit`. It discovers the repository, identifies relevant unknowns, assesses the selected scope, and produces a minimum-sufficient proposal or read-only audit report.

### Specification Architect

Creates or refines one definitive, implementation-ready specification for non-trivial behavior. It connects intent, acceptance criteria, implementation, tests, and documentation.

### Deterministic core

Owns path safety, file discovery, structured validation, artifact classification, stable serialization, change planning, atomic application, reference checks, idempotency, and machine-readable results. It does not make product decisions.

### Codex adapter

Translates accepted canonical knowledge into Codex-native files. It does not create a second source of truth.

## Discovery model

Discovery recursively inventories paths while classifying generated output, caches, build artifacts, vendored files, installed skills, project-authored material, and unknown-origin files.

Relevant content is then inspected to build:

- project facts with evidence and confidence;
- a source-of-truth map;
- existing instruction and skill routing;
- spec precedence and supersession relationships;
- available verification commands and their CI coverage;
- critical developer and user journeys;
- conflicts, gaps, duplication, and unnecessary complexity.

Enumeration and semantic inspection are separate. DevCharter must not treat every file as equally meaningful.

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
content or diff
```

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
