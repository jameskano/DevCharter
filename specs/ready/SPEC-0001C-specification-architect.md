# SPEC-0001C — Specification Architect

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0001C |
| Parent | SPEC-0001 |
| Status | ready |

## Purpose

Provide a reusable, model-neutral workflow for defining non-trivial development before implementation without turning ordinary work into bureaucracy.

The workflow is exposed as a Codex skill in v0.

## Conceptual operations

```text
$specification-architect create
$specification-architect refine <spec-id>
$specification-architect review <spec-id>
```

These describe skill workflows, not additional CLI modes.

## When a spec is required

A new or updated spec is normally required for:

- user-visible or business behavior;
- domain rules, data models, APIs, or integrations;
- security, privacy, identity, permissions, payments, deletion, or legal behavior;
- architecture or public contracts;
- migrations or changes with material dependencies and failure modes.

Obvious non-behavioral corrections and small behavior-preserving maintenance may use the existing contract without creating a new full spec.

## Workflow

```text
classify request
→ search for authoritative existing spec
→ read relevant project context
→ inspect current implementation and tests when present
→ identify confirmed facts, assumptions, and open questions
→ define problem, outcome, scope, non-goals, behavior, risks, and dependencies
→ write observable acceptance criteria
→ map criteria to verification
→ review readiness
→ human approval
→ ready
```

No session file is created. The same conversation may continue normally; durable accepted decisions are written into the spec.

## Context precedence

1. Current user instruction.
2. Applicable approved or active spec.
3. Accepted project decisions.
4. Current project and feature documentation.
5. Relevant implementation and tests.
6. Related done specs and ADRs.
7. Established repository conventions.

When sources disagree, expose the conflict instead of selecting silently.

## Questions and assumptions

Ask only questions that materially affect behavior, architecture, risk, or acceptance.

Use explicit justified assumptions for low-risk reversible details. Require confirmation for sensitive, irreversible, legal, public-contract, identity, permission, payment, privacy, deletion, or migration behavior.

Separate confirmed facts, inferences, assumptions, open questions, and rejected options.

## Default specification structure

Use one cohesive document by default and include only applicable sections:

1. Metadata and relationships.
2. Problem and desired outcome.
3. Scope and non-goals.
4. Current and required behavior.
5. User/developer flows and important states.
6. Domain, data, API, integration, security, privacy, or migration rules.
7. Failure and recovery behavior.
8. Material quality priorities, risks, and trade-offs.
9. Dependencies and affected documentation.
10. Confirmed facts, assumptions, decisions, and open questions.
11. Acceptance criteria.
12. Verification strategy.
13. Implementation constraints when necessary.
14. Completion evidence.

Separate requirements, design, tasks, acceptance, or test-plan files only when size, risk, independent ownership, or execution needs justify the split.

## Acceptance criteria

Criteria describe an observable starting state, action, and result. Cover alternate states only when relevant to the behavior and risk.

Each important criterion maps to one or more:

- unit/domain test;
- component or integration test;
- journey-level E2E test;
- static validation;
- manual verification.

## Task breakdown

When needed, tasks use a minimal contract:

```text
id
title
reason
scope or affected files
acceptance evidence
dependencies
risks, when material
```

Do not require assignee, estimate, priority, agent role, file ownership, or additional task status by default.

## Status and authority

```text
draft → ready → active → done
draft|ready|active → cancelled
```

- The workflow creates or updates `draft`.
- Only explicit human approval makes it `ready`.
- Implementation makes it `active`.
- Evidence-based completion makes it `done`.

Keep one authoritative file per ID. Use explicit `supersedes` or `superseded_by` metadata when replacing another specification.

## Implementation gate

Codex instructions prevent non-trivial behavior implementation when the required authoritative spec is missing or still draft. The workflow should help create or refine the spec rather than merely refusing.

Do not require a new spec for trivial work that does not change the existing contract.

## Documentation synchronization

Completion reviews affected current product, architecture, engineering, security, operational, and AI documentation. A reviewed-but-unchanged document includes a concise reason.

## Independent verification

The verifier reads the spec before the diff, maps requirements to code and test evidence, identifies scope/spec drift, and returns findings without rewriting code unless asked.

## Non-goals

- General backlog or sprint management.
- Persisted sessions.
- Automatic approval.
- Mandatory 20-section specifications.
- Separate documents for every planning concern.
- Autonomous product ownership.
- Role-agent orchestration.

## Acceptance criteria

1. The workflow distinguishes changes that need a spec from trivial behavior-preserving work.
2. It finds authoritative existing specs before creating new ones.
3. It exposes conflicts and precedence problems.
4. Questions are minimal and material.
5. Sensitive or irreversible decisions require confirmation.
6. Safe assumptions are explicit and evidence-backed.
7. The five-status model is used without additional task statuses.
8. Human approval is required for `ready`.
9. One cohesive spec is the default artifact.
10. Spec sections are included only when applicable.
11. Acceptance criteria are observable and mapped to verification.
12. Task breakdowns stay minimal and optional.
13. Supersession is explicit.
14. Non-trivial implementation is gated when the authoritative spec is missing or draft.
15. Current documentation is reviewed before `done`.
16. The model-neutral workflow is exposed as a correctly structured Codex skill.
17. Tests cover classification, context, assumptions, approval, supersession, evidence mapping, and completion gates.
