# SPEC-0001A — Core Foundation and Canonical Model

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0001A |
| Parent | SPEC-0001 |
| Status | active |
| Reason | Repository audit confirmed no donor implementation; build the approved clean-slate foundation |

## Purpose

Provide the deterministic clean-slate TypeScript foundation used by later DevCharter workflows.

## Goals

- TypeScript, Node.js, and pnpm foundation.
- Small neutral records for discovery, findings, proposals, file changes, and validation.
- Safe repository reading and atomic writing.
- Structured human and machine-readable errors and results.
- Stable serialization and optional compact configuration.
- Exact modes, scopes, and statuses.
- Offline core behavior without sessions or telemetry.

## Required public concepts

```ts
type Mode = 'new' | 'retrofit' | 'audit'
type Scope = 'full' | 'governance' | 'engineering' | 'ai'
type SpecStatus = 'draft' | 'ready' | 'active' | 'done' | 'cancelled'
type ChangeAction = 'create' | 'update' | 'skip' | 'conflict'
```

Blocking, review severity, validation outcome, and confidence are separate concepts.

## Neutral records

The core supports cohesive records equivalent to:

### `ProjectFact`

- key and value;
- evidence path or source;
- confidence when inferred;
- confirmed/inferred/assumed state.

### `ArtifactRecord`

- repository-relative path;
- kind;
- origin: project, DevCharter, third-party, generated/vendor, or unknown;
- ownership when determinable;
- native target or project convention when relevant;
- referenced paths or commands;
- managed status when explicitly applicable.

Artifact kinds are internal analysis categories, not new public scopes.

### `Finding`

- stable code;
- summary and evidence;
- affected scope;
- impact;
- confidence;
- recommended action;
- uncertainty or question when applicable.

### `EcosystemProposal`

- mode, scope, and repository revision/fingerprint;
- facts, assumptions, findings, and desired outcome;
- considered components;
- planned file changes;
- risks, validation, and deferred work;
- proposal revision and approval state.

### `PlannedFileChange`

- path;
- action: create, update, skip, or conflict;
- purpose and reason;
- origin/ownership classification;
- proposed content or diff;
- applicable adapter;
- validation expectations.

### `ValidationResult`

- outcome;
- checks run and actual results;
- warnings and failures;
- changed paths;
- skipped checks and reasons.

## Persisted configuration

Do not require separate project, quality, SDD, approval, assumption, ecosystem, documentation-map, and capability files.

When durable project choices cannot be reliably inferred, support one compact optional file:

```text
.devcharter.yaml
```

It may contain only accepted, non-secret decisions such as selected AI tools, deliberately non-default paths, important verification commands, and explicitly retained project constraints.

Audit works without creating or modifying it.

Earlier `.ai/*.yaml` configuration may be read for compatibility. Consolidation, retention, or removal is decided by an approved migration plan, not assumed by this spec.

## Managed-output receipt

The core may support a small receipt after approved generation containing generated paths, adapter, baseline hash, and managed/unmanaged status.

The receipt:

- is not a session;
- contains no conversation or interview answers;
- is not required for audit;
- does not make ordinary starter documentation uneditable;
- exists only to support provenance, safe updates, and drift detection.

## Package boundaries

Preferred:

```text
packages/
├── core/
├── cli/
└── adapter-codex/
```

Create only the core and CLI packages for this specification. Runtime schemas belong in core. The Codex adapter remains deferred to SPEC-0001D.

## Core responsibilities

- Safe YAML parsing without executable or unsafe features.
- Runtime validation for persisted structured data.
- Repository-root path containment.
- Recursive file inventory with configurable ignores.
- Classification support for generated/vendor/cache material.
- Stable serialization and hashing.
- Atomic writes.
- Structured errors.
- Proposal revision/fingerprint support.
- Read-only audit enforcement primitives.
- Human and JSON result formats.

## Initial CLI

At minimum:

```bash
devcharter inspect
devcharter validate
```

`inspect` reports discovered facts and artifacts without proposing the full ecosystem workflow. Complete `new`, `retrofit`, and `audit` behavior belongs to 0001B. Generation belongs to 0001D.

There is no `check` alias.

## Clean-slate implementation decision

The repository and its recoverable Git history contain no donor implementation. Existing root TypeScript and pnpm tooling is infrastructure, not a compatibility contract. Implement the product architecture and public contracts in this specification without recreating old APIs, sessions, check behavior, extra scopes or statuses, profile matrices, quality ranking, capability matrices, or broader governance-platform abstractions.

No old public API or compatibility guarantee exists. If old code is recovered separately, assess it read-only before considering independently useful low-level behavior. Recovery does not change this architecture or authorize transplantation automatically.

Compatibility work in this specification is limited to detecting encountered `.ai/*.yaml` files, reading them safely without writes, preserving paths and parse errors, and reporting that explicit migration is required.

## Non-goals

- Project Architect recommendation logic.
- Specification workflow.
- Ecosystem file generation.
- Codex skills.
- Release qualification.
- Product decisions derived from heuristics.
- Network access or telemetry.

## Acceptance criteria

1. Repository and Git state are audited and the clean-slate decision is recorded before implementation.
2. Useful repository infrastructure is preserved without treating any legacy API as a compatibility contract.
3. Modes, scopes, statuses, and change actions exactly match this spec.
4. Session and check functionality are absent from the public v0 surface.
5. Neutral records support evidence, confidence, origin/ownership, findings, proposals, file plans, and validation.
6. The core does not require eight separate policy/profile files.
7. Optional `.devcharter.yaml` is compact, safe, and contains no secrets or conversation state.
8. Existing earlier configuration is handled through explicit compatibility/migration behavior.
9. YAML is strictly and safely validated.
10. Repository path traversal and writes outside the root are rejected.
11. Writes are atomic and failures are structured.
12. Audit-read-only primitives are testable.
13. Core and CLI work offline without telemetry.
14. Human and JSON results are stable and testable.
15. Tests cover schemas/records, filesystem safety, statuses, compatibility migration, and no-write behavior.
16. Documentation matches the reconciled model and every criterion maps to evidence.
