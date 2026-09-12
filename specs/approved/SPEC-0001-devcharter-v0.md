# SPEC-0001 — DevCharter v0

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0001 |
| Title | DevCharter v0 |
| Type | Parent product and architecture specification |
| Status | ready |
| Implementation | TypeScript, Node.js, pnpm |
| Complete v0 adapter | Codex |

## Purpose

Build a focused local package that creates or improves the AI-assisted development ecosystem of a new or existing software repository.

DevCharter discovers current state, identifies material unknowns, proposes the minimum useful setup, safely applies approved changes, and validates that the resulting developer workflow works.

## Product promise

> Give a repository the smallest, safest, and most useful AI development system it actually needs.

## Goals

1. Support new and existing repositories.
2. Analyze current state and intended direction before asking questions.
3. Keep important conclusions evidence-backed.
4. Propose before writing.
5. Preserve useful existing conventions and user-owned content.
6. Generate only justified governance, engineering, and AI artifacts.
7. Provide a definitive specification workflow for non-trivial development.
8. Keep the deterministic core and canonical analysis model-neutral.
9. Fully support Codex-native instructions and skills in v0.
10. Validate output, references, commands, idempotency, and critical journeys.
11. Remain practical for solo developers and small teams.

## Non-goals

DevCharter v0 is not:

- a hosted SaaS;
- a project-management or issue-tracking platform;
- an agent orchestration runtime or task dashboard;
- a persisted conversation, interview-session, memory, or vector system;
- a provider-routing, sandbox, terminal, worktree, or policy-enforcement service;
- a `check` command alongside audit;
- a marketplace or template catalog;
- a continuous semantic monitoring service;
- an automatic pull-request or protected-branch writer;
- a complete multi-vendor adapter suite;
- an autonomous approver or product owner.

## Public modes

```text
new
retrofit
audit
```

### New

Proposes a lightweight foundation for a new or lightly initialized repository. If meaningful implementation already exists, recommend retrofit.

### Retrofit

Analyzes an existing repository and proposes targeted improvements without replacing useful files blindly.

### Audit

Performs a read-only review and reports findings, evidence, uncertainty, and recommended follow-up.

## Public scopes

```text
full
governance
engineering
ai
```

- `full`: union of governance, engineering, and AI.
- `governance`: project truth, specs, decisions, and documentation synchronization.
- `engineering`: development commands, tests, CI, and foundations required for reliable AI work.
- `ai`: instructions, skills, and selected tool-native configuration.

Cross-cutting qualities are evaluated inside applicable scopes; they are not extra public scopes.

## Core flows

New and retrofit:

```text
discover → understand → ask material unknowns → assess
→ propose create/update/skip/conflict → approve → apply → validate → report
```

Audit:

```text
discover → assess → report
```

Audit cannot write.

## Discovery requirements

DevCharter must:

- recursively inventory the repository;
- classify caches, builds, vendored/generated content, installed dependencies, and project-authored files;
- inspect relevant manifests, commands, CI, docs, specs, tests, AI instructions, and selected implementation;
- distinguish developer-AI setup from runtime/product AI;
- attach evidence and confidence to material inferred facts;
- build a source-of-truth and spec-precedence map;
- validate referenced paths, scripts, commands, and instruction routing;
- detect conflicts, duplication, obsolete files, unjustified components, and verification gaps;
- identify critical developer and user journeys;
- ask only what cannot be discovered safely.

## Proposal requirements

Every new or retrofit proposal includes:

- detected facts and evidence;
- assumptions and open questions;
- desired outcome;
- create, update, skip, preserve, and conflict decisions;
- reason and expected value for every proposed artifact;
- considered and rejected components;
- ownership and third-party provenance implications;
- risk and verification plan;
- deferred work.

No write may occur before explicit approval of the current proposal revision.

## Minimum ecosystem rule

DevCharter may conclude that the existing setup is adequate or that only one or two artifacts need improvement.

It must not generate role-agent fleets, prompt libraries, nested instruction files, skills, hooks, MCP integrations, CI, or additional tools merely because templates exist.

## Specification Architect

For non-trivial behavior, DevCharter finds or creates one authoritative spec, records scope and non-goals, resolves material unknowns, writes observable acceptance criteria, maps them to verification, and gates implementation until human approval makes the spec `ready`.

Use only:

```text
draft → ready → active → done
draft|ready|active → cancelled
```

## Canonical knowledge and configuration

Current project truth should remain in ordinary project documentation and code. Development definitions and history live in specs.

When durable DevCharter-specific decisions cannot be inferred, prefer one compact `.devcharter.yaml` rather than multiple policy profiles. Audit does not create it.

A small managed-file receipt may exist after approved generation for provenance and drift detection. It is not a source of product truth or conversation state.

## Codex support

The Codex adapter uses official native mechanisms:

- concise layered `AGENTS.md` instructions;
- `.agents/skills/<name>/SKILL.md` for stable repeatable workflows;
- `.codex/` configuration only when supported and justified.

It does not copy conventions from other AI tools into invented Codex formats.

## Safe generation

- Plan every target as `create`, `update`, `skip`, or `conflict`.
- Preserve user-owned content by default.
- Use repository-root containment and atomic writes.
- Avoid repeated append-only updates.
- Treat starter documentation as project-owned after application unless explicitly managed.
- Use managed-region markers only as an exceptional approved strategy.
- Report partial application accurately and never claim rollback without evidence.

## Verification

Verification is proportional to risk and includes, as applicable:

- targeted unit or component tests;
- full local verification;
- integration tests;
- critical journey-level E2E tests;
- manual checks for external systems or platforms.

Many isolated passing tests do not replace proof that a critical workflow functions end to end.

## Clean-slate implementation

The current repository and its recoverable Git history contain no donor implementation. DevCharter v0 uses this specification set as the sole product and public-contract authority and is implemented with a clean-slate architecture.

No old public API or compatibility guarantee applies. If old code is recovered separately, it requires a new read-only assessment. Recovery does not change this architecture or authorize reuse automatically.

## Implementation specifications

- 0001A — Core foundation and canonical model
- 0001B — Project Architect workflow
- 0001C — Specification Architect
- 0001D — Ecosystem generator and Codex adapter
- 0001E — Validation and release readiness

## Parent acceptance criteria

1. Modes are exactly new, retrofit, and audit.
2. Scopes are exactly full, governance, engineering, and ai.
3. Statuses are exactly draft, ready, active, done, and cancelled.
4. There is no public check operation or persisted interview-session subsystem.
5. Audit is deterministically read-only.
6. New and retrofit require an approved current proposal before writes.
7. Discovery is evidence-backed and distinguishes authored, third-party, generated, and irrelevant material.
8. Developer-AI and runtime/product AI are not conflated.
9. Existing useful content is preserved by default.
10. Every proposed artifact is individually justified; unnecessary components may be rejected.
11. Non-trivial development uses one authoritative spec by default.
12. Codex output uses supported native instruction and skill mechanisms.
13. Generation is safe, deterministic, conflict-aware, and idempotent.
14. References, commands, spec precedence, provenance, and source-of-truth conflicts are validated.
15. Critical journeys and negative requirements are tested.
16. Completion requires implementation, tests, documentation review, and acceptance evidence.
