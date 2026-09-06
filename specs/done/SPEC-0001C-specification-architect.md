# SPEC-0001C — Specification Architect

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0001C |
| Parent | SPEC-0001 |
| Status | done |

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

- Creation starts at `draft`. Refining a `draft` keeps it `draft`.
- Refining a `ready` or `active` specification preserves its status; refinement never creates an unsupported backward transition.
- If a refinement materially changes approved behavior, record that renewed approval is required and do not begin or continue the affected implementation until a human explicitly approves the revision. Approval state is metadata, not another status.
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
18. Refinement keeps `draft` specifications in `draft`, preserves `ready` or `active` status, and gates affected implementation on renewed explicit human approval when approved behavior changes materially.

## Implementation evidence

Status: done. The minimum completion fixes and author verification are complete. A fresh independent
completion review found no blocking gaps, and the user explicitly approved the `active -> done`
transition on 2026-09-06. No separate forward model evaluation was run; the scenario matrix remains
author walkthrough evidence and is not represented as independent model evidence.

### Implemented behavior

- Added one instruction-only repository skill at
  `.agents/skills/specification-architect/SKILL.md`; no scripts, assets, references, UI metadata,
  connectors, sessions, persistence, runtime API, package export, or CLI command were added.
- Implemented the `create`, `refine`, and `review` procedures with inspect-first authority discovery,
  explicit context precedence, separate knowledge and decision categories, material questions,
  sensitive-decision confirmation, cohesive draft authoring, observable criteria, verification
  mapping, supersession, and lifecycle gates.
- Clarified refinement lifecycle behavior: a draft remains draft, a ready or active specification
  preserves its status, and a material change to approved behavior pauses affected implementation
  until renewed explicit human approval without inventing a backward status transition.
- Replaced the test's hardcoded active path with deterministic discovery of exactly one declared
  `SPEC-0001C` across the specification tree, including directory/status agreement.
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
| Refine a draft | Preserves `draft` while incorporating supported evidence and decisions. | Pass |
| Refine a ready specification | Preserves `ready`; a material approved-behavior change requires renewed explicit human approval before implementation begins. | Pass |
| Refine an active specification | Preserves `active`; a material approved-behavior change pauses the affected implementation until renewed explicit human approval. | Pass |
| Conflicting or duplicate authority | Exposes the conflict and blocks readiness until authority is resolved explicitly. | Pass |
| Sensitive unresolved decision | Requires explicit confirmation and prohibits converting the decision into an assumption or default. | Pass |
| Readiness review | Checks authority, scope, decisions, assumptions, criteria, verification mapping, and explicit human approval before `ready`. | Pass |
| Completion review with missing evidence | Withholds `done` and identifies missing implementation, criterion, verification, documentation, limitation, or deferred-work evidence. | Pass |
| Successful completion review | Recommends `done` only after all completion evidence is recorded and no material deviation remains outside the approved spec. | Pass |

### Verification results

| Command or check | Actual result |
|---|---|
| Targeted Specification Architect skill tests | Initial run exposed one wording mismatch between the specification and its exact assertion; after aligning the wording, passed: 1 file and 10 tests. |
| `pnpm format:check` | Initial check identified the expanded test for formatting; after Prettier, passed. |
| `pnpm lint` | Passed. |
| `pnpm typecheck` | Passed. |
| `pnpm test` | Passed: 10 files and 336 tests, including the build performed by the test script. |
| `pnpm build` | Passed independently after the full test run. |
| `pnpm devcharter validate --format json` | Passed with no configuration, legacy files, warnings, failures, skipped checks, or changed paths. The restricted launcher returned `EPERM`; the same command passed in the approved execution context. |
| Built full-scope read-only audit | Passed with zero findings, no proposal, zero planned changes, and zero applied changes. The restricted launcher returned `EPERM`; the same command passed in the approved execution context. |
| Audit Git/no-write verification | Passed: the three-entry intended Git status was unchanged and `.git/index` retained SHA-256 `C50011CD329A96E0B739CBA5C8BFFBFA0203DDF6F451B8EC41742F8DCF6347CF`, UTC modification time `2026-09-05 23:28:22`, and length 6882 bytes. |
| `git diff --check` and final diff/status review | Passed; only line-ending notices were reported. The review showed three intended files, 130 insertions, and 41 deletions, with no unrelated changes. |

### Independent completion review

On 2026-09-06, a fresh reviewer read this specification before the implementation diff, mapped all
18 acceptance criteria to the skill and focused tests, confirmed that no SPEC-0001D or SPEC-0001E
behavior was added, and found no completion blocker. The reviewer reran the focused 10-test suite,
formatting, linting, type checking, all 336 tests, an independent build, the built validator, and a
full-scope read-only audit. Every check passed; the audit reported zero findings, no proposal, no
planned changes, and no applied changes. The validator and audit required the approved execution
context after the restricted launcher returned `EPERM` while resolving the workspace path.

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
| 16 | The ten-test skill suite validates the native repository location, frontmatter, triggers, workflow, lifecycle, authoritative-spec discovery, directory/status consistency, single-file layout, and prohibited extras. |
| 17 | Focused automated assertions and the author walkthrough matrix cover classification, context and authority, assumptions, approval, supersession, evidence mapping, and completion gates. |
| 18 | Focused skill and authoritative-spec assertions cover draft preservation, ready/active status preservation, prohibition of backward transitions, and renewed explicit approval before affected implementation proceeds after a material approved-behavior change. |

### Documentation review, limitations, and deferred work

Updated in this completion-fix and closeout pass: this authoritative specification's lifecycle rule,
acceptance criteria, completion evidence, status, and location; the Specification Architect skill;
its focused instruction tests; MANIFEST and README routing; the system overview's current status;
and the audit/plan prompt for the next ready specification.

Reviewed unchanged: AGENTS.md, the purpose and scope, quality and decision model, spec-driven
workflow, specs index, parent SPEC-0001, official Codex capability reference, implementation and
completion-review prompts, and the SPEC-0001A/B and SPEC-0001D/E specifications. Their authority,
product-boundary, lifecycle, and later-spec boundaries remain accurate. Ready SPEC-0001D/E status
was not changed.

Limitations: the skill is an instruction workflow rather than a deterministic semantic engine; its
behavior depends on the invoking model correctly following repository evidence and the skill. The
automated suite verifies structure and decision-critical instructions, while the scenario matrix is
an author walkthrough rather than an independent forward evaluation. The optional bundled Python
validator could not run because Python is unavailable.

Deferred without implementation: rendering and application, adapters, managed-output receipts,
drift handling, Project Architect skill generation, release qualification, cross-specification E2E
release journeys, and the Habit Compass pilot remain in SPEC-0001D–E.
