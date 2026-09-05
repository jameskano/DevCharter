# SPEC-0001C — Specification Architect

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0001C |
| Parent | SPEC-0001 |
| Status | active |

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

## Implementation evidence

Status: implementation and author verification are complete. This specification remains `active`
pending a fresh independent completion review and explicit user approval.

### Implemented behavior

- Added one instruction-only repository skill at
  `.agents/skills/specification-architect/SKILL.md`; no scripts, assets, references, UI metadata,
  connectors, sessions, persistence, runtime API, package export, or CLI command were added.
- Implemented the `create`, `refine`, and `review` procedures with inspect-first authority discovery,
  explicit context precedence, separate knowledge and decision categories, material questions,
  sensitive-decision confirmation, cohesive draft authoring, observable criteria, verification
  mapping, supersession, and lifecycle gates.
- Completion review requires implementation, tests, acceptance evidence, documentation dispositions,
  limitations, and deferred work. A material deviation must be incorporated into the authoritative
  specification and explicitly approved; informal approval cannot bypass `done` requirements.
- Kept Project Architect unchanged except for the preceding bounded SPEC-0001B Maven XML
  well-formedness correction. No authority-analysis extraction or symmetry refactor was needed.

### Manual skill scenario matrix

These author walkthroughs used the skill's routing and gates against the stated starting condition;
they validate the instruction outcome without claiming an independent model evaluation.

| Scenario | Observed skill outcome | Result |
|---|---|---|
| Trivial behavior-preserving maintenance | Requires evidence that observable behavior and the existing contract remain unchanged, then proceeds without a placeholder specification. | Pass |
| Material feature | Requires an authoritative specification and creates one cohesive `draft` before implementation. | Pass |
| Existing authoritative specification | Routes to refine or review of that file instead of creating a duplicate ID. | Pass |
| Conflicting or duplicate authority | Exposes the conflict and blocks readiness until authority is resolved explicitly. | Pass |
| Sensitive unresolved decision | Requires explicit confirmation and prohibits converting the decision into an assumption or default. | Pass |
| Readiness review | Checks authority, scope, decisions, assumptions, criteria, verification mapping, and explicit human approval before `ready`. | Pass |
| Completion review with missing evidence | Withholds `done` and identifies missing implementation, criterion, verification, documentation, limitation, or deferred-work evidence. | Pass |
| Successful completion review | Recommends `done` only after all completion evidence is recorded and no material deviation remains outside the approved spec. | Pass |

### Verification results

| Command or check | Actual result |
|---|---|
| Targeted SPEC-0001B Maven correction tests | Passed: 2 files and 262 tests; 98 direct runtime-AI tests and 164 public Project Architect tests. |
| Targeted Specification Architect skill tests | Passed: 1 file and 6 tests. |
| Bundled `quick_validate.py` | Skipped: no Python interpreter is installed. Equivalent frontmatter, name/path, and unfinished-layout invariants are covered by the Vitest skill checks. |
| `pnpm format:check` | Passed. |
| `pnpm lint` | Passed. |
| `pnpm typecheck` | Passed. |
| `pnpm test` | Passed: 10 files and 332 tests, including the build performed by the test script. |
| `pnpm build` | Passed independently after the full test run. |
| `pnpm devcharter validate --format json` | Passed with no configuration, legacy files, warnings, failures, skipped checks, or changed paths. The restricted launcher returned `EPERM`; the same command passed in the approved execution context. |
| Built CLI mode/scope matrix | Passed all 12 `new|retrofit|audit × full|governance|engineering|ai` combinations with the requested scope and zero applied changes; audit returned no proposal. |
| Built full-scope audit | Passed with zero findings, no proposal, zero planned changes, and zero applied changes. |
| Audit Git/no-write verification | Passed: the final 12-entry in-progress Git status was byte-for-byte unchanged and `.git/index` retained SHA-256 `428B03CA7DD5C4527898C66215A90BB4FCC8CB84B61072486439475BCE069245` and its modification time. |
| Project Architect import boundary | Passed the focused test; static search found no writer, network, fetch, or telemetry reference in Project Architect modules or the CLI entry point. |
| `git diff --check` and final diff/status review | Passed; only line-ending notices were reported. The review found the intended SPEC-0001B correction, SPEC-0001C lifecycle move, single skill, focused tests, and current-documentation updates, with no unrelated external changes. |

### Acceptance evidence

| Criterion | Evidence |
|---|---|
| 1 | Trigger boundary, classification instructions, automated assertions, and the trivial/material manual scenarios distinguish specification work from behavior-preserving maintenance. |
| 2 | Inspect-first instructions require searching all specification locations and declared IDs before creation; the existing-authority scenario routes to refine/review. |
| 3 | Context precedence and authority instructions expose disagreements; duplicate, relationship, and directory/status problems block readiness. |
| 4 | Questions are limited to matters affecting behavior, architecture, risk, or acceptance, with inspection preferred when it can resolve uncertainty. |
| 5 | The separate-knowledge gate requires explicit confirmation for every sensitive or irreversible decision class listed by this specification. |
| 6 | Assumptions are limited to low-risk reversible details and record evidence, impact if wrong, and reversibility. |
| 7 | Skill and automated checks use only `draft`, `ready`, `active`, `done`, and `cancelled`; blocking and review outcomes remain metadata. |
| 8 | Readiness explicitly states that only human approval permits `draft -> ready` and that the agent cannot grant approval. |
| 9 | Create uses one cohesive draft by default. |
| 10 | The skill says to include only applicable sections and not create empty future-facing sections. |
| 11 | Criteria require starting state, action, and result, and each important criterion maps to an allowed automated or manual verification method. |
| 12 | Optional tasks contain only the minimal specified fields and reject default assignees, estimates, priorities, roles, locks, or extra task statuses. |
| 13 | Refinement requires explicit `supersedes` or `superseded_by` metadata and applicable index or parent updates. |
| 14 | The implementation gate blocks non-trivial work for missing, conflicted, or draft authority and helps create/refine the contract. |
| 15 | Completion review requires current-documentation review and a reason for every reviewed-but-unchanged document. |
| 16 | The six-test skill suite validates the native repository location, frontmatter, triggers, workflow, lifecycle, status consistency, single-file layout, and prohibited extras. |
| 17 | Automated checks and the eight-case author walkthrough cover classification, context, assumptions, approval, supersession, evidence mapping, and completion gates. |

### Documentation review, limitations, and deferred work

Updated: README current implementation and next step, the system overview current implementation and
skill boundary, MANIFEST active-spec routing, the audit/plan prompt's active path, SPEC-0001B
correction evidence, and this implementation record.

Reviewed unchanged: AGENTS.md already defines the governing specification, decision, safety, and
completion rules; purpose and scope already state the correct product boundary; the quality and
decision model already defines evidence, assumptions, precedence, and approval; the spec-driven
workflow already matches the skill; the official Codex capability reference already uses the native
skill path and instruction-first design; the specs index and parent SPEC-0001 already define the
correct authority and lifecycle; completed SPEC-0001A remains historical foundation evidence;
SPEC-0001D–E remain accurate future boundaries; and the generic implementation and completion-review
prompts require no change.

Limitations: the skill is an instruction workflow rather than a deterministic semantic engine; its
behavior depends on the invoking model correctly following repository evidence and the skill. The
automated suite verifies structure and decision-critical instructions, while the scenario matrix is
an author walkthrough rather than an independent forward evaluation. The optional bundled Python
validator could not run because Python is unavailable.

Deferred without implementation: rendering and application, adapters, managed-output receipts,
drift handling, Project Architect skill generation, release qualification, cross-specification E2E
release journeys, and the Habit Compass pilot remain in SPEC-0001D–E.
