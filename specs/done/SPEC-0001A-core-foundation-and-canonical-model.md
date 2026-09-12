# SPEC-0001A — Core Foundation and Canonical Model

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0001A |
| Parent | SPEC-0001 |
| Status | done |
| Reason | Clean-slate foundation implemented, verified against all acceptance criteria, and completion-reviewed |

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

- mode, scope, scoped repository fingerprint, and complete proposal fingerprint;
- facts, assumptions, accepted decisions, questions, findings, and desired outcome;
- critical journeys and considered components;
- staged planned file changes and explicitly preserved paths;
- risks, validation, and deferred work;
- proposal revision and derived approval state.

### `PlannedFileChange`

- path;
- action: create, update, skip, or conflict;
- purpose and reason;
- origin/ownership classification;
- dependencies and maintenance implication;
- proposed content or diff when the change has reached the rendered application stage;
- applicable adapter when rendering selects one;
- validation expectations.

SPEC-0001B evolves this neutral record into a staged contract: abstract Project Architect
create/update decisions do not yet require content, diff, or adapter. SPEC-0001D must narrow the
same record before application so rendered create/update changes contain reviewable content or a
diff. This evolution preserves the SPEC-0001A action, path-safety, and validation guarantees.

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

## Implementation evidence

Status: complete; the repeated read-only completion review passed.

### Implementation revisions

- 2b56df4 — clean-slate specification baseline.
- 1ce21cb — core and CLI workspace foundation with regenerated lockfile.
- f1b389c — canonical records, compact configuration, safe YAML, and stable serialization.
- 22a25c1 — repository containment, deterministic inventory, atomic writer, and legacy detection.
- 591725f — exact read-only CLI surface and integration tests.
- 7ce6d80 — platform-stable ordering and strengthened failure/configuration coverage.
- 877ff30 — completion-review fixes for safe error details, strict commands, path safety, and evidence coverage.

Only packages/core and packages/cli exist. Runtime dependencies are limited to Zod for runtime schemas and YAML for the safe parsing boundary. The CLI uses Node's argument parser and has no writer, Commander, minimatch, network, or telemetry dependency.

### Verification results

| Command or check | Actual result |
|---|---|
| pnpm format:check | Passed. |
| pnpm lint | Passed. |
| pnpm typecheck | Passed. |
| pnpm build | Passed. |
| pnpm test | Passed: 7 files, 51 tests. |
| pnpm devcharter --help | Passed; lists only inspect and validate. |
| pnpm devcharter --version | Passed; reports 0.1.0. |
| pnpm devcharter validate | Passed with no configuration and no legacy profiles. |
| pnpm devcharter inspect --format json | Passed with stable JSON and repository-relative artifacts. |
| Negative CLI tests | Passed for later modes, check, sessions, generation, migration, positional roots, and invalid formats. |
| Read-only integration checks | Passed using before/after path, content-hash, size, and modification-time snapshots. |
| Dependency/import audit | Passed; no runtime network or telemetry imports and only Zod/YAML production dependencies. |
| Follow-up prompt-routing review | Passed; README, MANIFEST, the audit-and-plan prompt, and specification statuses route the next implementation plan to SPEC-0001B. |

Dependency installation completed from the available package cache while the environment reported certificate-chain warnings for registry metadata. Runtime and verification require no network.

### Acceptance evidence

| Criterion | Evidence |
|---|---|
| 1 | Repository/Git audit, isolated devcharter-v0-clean branch, import receipt verification, and documentation-only baseline commit preceded package creation. |
| 2 | Existing TypeScript, pnpm, lint, formatting, and Vitest infrastructure is retained and passes; no legacy API is exported. |
| 3 | Canonical-schema tests assert the exact modes, scopes, statuses, and change actions. |
| 4 | CLI dispatch and negative tests reject check, sessions, and all later commands. |
| 5 | Runtime-schema tests cover facts, evidence/confidence, artifacts/origin/ownership, findings, proposals, file changes, and validation. |
| 6 | Configuration is optional and no obsolete eight-profile schemas or requirements exist. |
| 7 | Compact-config tests cover versioning, ordered verification commands, strict keys, duplicate names, invalid types, and prohibited secret/session/ranking/matrix fields. |
| 8 | Valid, malformed, and absent legacy fixtures preserve paths/errors, require explicit migration, and perform zero writes. |
| 9 | Safe-YAML tests reject malformed input, duplicate keys, multiple documents, custom tags, aliases, and collection keys. |
| 10 | Containment tests reject traversal, absolute/UNC/drive paths, and symlink escapes; contained reads/writes pass. |
| 11 | Atomic-writer tests cover create/update, flush/rename, traversal, cleanup, injected failure, and reported partial parent creation. |
| 12 | CLI imports only the read-only core entry point; static and filesystem-snapshot tests prove zero writes. |
| 13 | Production dependency and source-import audits show no network/telemetry capability; CLI integration runs locally without network. |
| 14 | Human/JSON, line-ending, object-key, array-order, path-set, and hash tests pass. |
| 15 | The 51-test suite covers records, config/YAML, serialization, filesystem safety, writer failures, representative legacy input, exact CLI surface, and zero-write behavior. |
| 16 | README, architecture status, manifest routing, and current Codex prompts are synchronized; affected documentation was reviewed as listed below. |

### Independent completion review

The initial fresh read-only review found no later-spec scope drift but required four focused corrections: reject blank verification commands, avoid source-line excerpts in YAML errors, directly test the exact runtime schemas and representative neutral records, and strengthen writer-path and whole-CLI dependency evidence. Revision 877ff30 addressed those findings.

The repeated read-only review inspected the acceptance criteria, full implementation diff, public exports, source and tests, dependency graph, CLI behavior, current documentation, Git state, and verification output. It found no remaining blocking or important findings and returned PASS. SPEC-0001A is eligible for `done`.

A later independent read-only follow-up review reran the recorded checks and found one important documentation issue: the audit-and-plan prompt referenced the completed SPEC-0001A file while still asking for a plan to complete SPEC-0001A. That review returned PASS WITH FIXES and withheld a `done` recommendation until the routing was corrected.

The follow-up correction retargeted the audit-and-plan prompt to ready SPEC-0001B, preserved SPEC-0001A as the completed foundation, and updated this completion record. A narrow routing and status review then confirmed that README, MANIFEST, current prompts, and specification locations consistently identify SPEC-0001B as the next implementation-planning target. With the important finding closed, SPEC-0001A remains eligible for `done`.

### Documentation review and deferrals

Updated during implementation: README.md, the system overview, the parent and SPEC-0001A clean-slate wording, and the manifest.

Updated after the follow-up completion review: the audit-and-plan prompt was retargeted from completed SPEC-0001A to ready SPEC-0001B, and this completion evidence was corrected to record the finding and verification.

Reviewed unchanged: AGENTS.md, purpose and scope, quality and decision model, spec-driven workflow, Codex capability reference, specs index, implementation and completion-review prompts, and SPEC-0001B–E. They remain consistent with this foundation and route later behavior to its owning specification.

Deferred exactly as specified:

- SPEC-0001B — new, retrofit, audit, semantic assessment, proposals, and approvals.
- SPEC-0001C — Specification Architect workflow and skill.
- SPEC-0001D — generation, application, adapters, receipts, and drift/merge behavior.
- SPEC-0001E — release matrix, cross-spec E2E journeys, and Habit Compass pilot.
