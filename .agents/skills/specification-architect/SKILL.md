---
name: specification-architect
description: Create, refine, or review an authoritative specification for non-trivial development, including readiness and completion gates. Do not use for small behavior-preserving maintenance or to re-plan implementation already governed by an adequate ready or active specification.
---

# Specification Architect

Define one implementation-ready behavior contract without turning routine maintenance into process.

## Route the request

Use the requested operation when the user supplies one:

- `create`: decide whether a specification is needed, find existing authority, and create one draft only when necessary.
- `refine <spec-id>`: improve the authoritative draft or reconcile it with discovered behavior and decisions.
- `review <spec-id>`: perform a readiness, implementation-gate, or completion review without rewriting implementation unless explicitly asked.

If the operation is omitted, infer it from the requested outcome. Ask only when choosing the wrong operation would materially change the work.

## Inspect before deciding

Read applicable repository instructions first. Inspect Git state, the specification index and every specification location, current product and engineering documentation, accepted decisions, related done specifications or ADRs, relevant implementation and tests, and repository-native verification commands.

Treat repository files as authoritative over conversation history or imported examples. Do not infer that a file is authoritative merely from its directory or filename. Search for its declared ID, status, parent, and `supersedes` or `superseded_by` relationships.

Apply context precedence in this order:

1. Current user instruction.
2. Applicable approved or active specification.
3. Accepted project decision.
4. Current project or feature documentation.
5. Relevant implementation and tests.
6. Related done specifications and ADRs.
7. Established repository convention.
8. Conservative reversible default, otherwise ask or leave unresolved.

Expose conflicts between authoritative-looking sources. Do not silently choose one.

## Classify whether a specification is required

A new or updated specification is normally required for user-visible or business behavior; domain rules; data models; APIs or integrations; security, privacy, identity, permissions, payments, deletion, or legal behavior; architecture or public contracts; migrations; or changes with material dependencies, risks, or failure behavior.

An obvious non-behavioral correction or small behavior-preserving maintenance task may use its existing contract without a new full specification. This exception requires evidence that observable behavior and the existing contract remain unchanged. If that cannot be established, inspect further or ask one material question.

When no specification is needed, state the governing existing contract and the evidence that the work is behavior-preserving. Do not create a placeholder draft.

## Separate knowledge and decisions

Keep these categories distinct:

- confirmed facts, each with its repository or user source;
- inferences, each with evidence and confidence;
- assumptions, limited to low-risk reversible details and recording evidence, impact if wrong, and reversibility;
- accepted decisions, including who or what confirmed them;
- open questions that materially affect behavior, architecture, risk, or acceptance;
- rejected options and the reason they were rejected.

Require explicit confirmation for security, privacy, identity, permissions, payments, legal behavior, destructive behavior, data deletion, migrations, secrets, external data sharing, irreversible choices, and public contracts. Do not convert a sensitive unresolved decision into an assumption or recommended default.

## Create

Before assigning an ID, confirm that no authoritative specification already covers the requested behavior. If one exists, route to `refine` or `review`.

Create one cohesive `draft` by default. Include only applicable sections from:

- metadata and explicit relationships;
- problem and desired outcome;
- scope and non-goals;
- current and required behavior;
- user or developer flows and important states;
- applicable domain, data, API, integration, security, privacy, migration, failure, and recovery rules;
- material quality priorities, risks, trade-offs, and dependencies;
- affected current documentation;
- facts, assumptions, decisions, rejected options, and open questions;
- observable acceptance criteria and verification mapping;
- implementation constraints when needed;
- completion evidence when implementation exists.

Split requirements, design, tasks, acceptance, or test plans only when size, risk, independent ownership, or execution sequencing makes the split materially clearer. Do not create empty sections for possible future concerns.

Write every important acceptance criterion as an observable starting state, action, and result. Cover loading, empty, error, permission, destructive, recovery, and accessibility states only when relevant. Map each criterion to practical unit/domain, component/integration, journey-level E2E, static, or manual verification.

When an implementation breakdown is useful, keep each task to ID, title, reason, scope or affected files, acceptance evidence, dependencies, and material risks. Do not add assignees, estimates, priorities, agent roles, file locks, or another task status model by default.

## Refine

Edit only the authoritative specification. Preserve compatible behavior, identify actual gaps, and distinguish required changes from independently useful extras. Do not restructure for style or naming alone.

Keep one authoritative file per ID. When behavior replaces another specification, record an explicit `supersedes` or `superseded_by` relationship and update the applicable index or parent relationship. A duplicate ID, missing relationship target, directory/status mismatch, or unresolved precedence conflict blocks readiness.

Update scope, behavior, decisions, risks, dependencies, criteria, verification, and affected-documentation expectations only where new evidence or an accepted decision requires it. Leave material open questions visible and keep the status `draft`.

## Review

Read the authoritative specification before the diff or implementation.

For readiness, verify that authority is unambiguous; the problem, outcome, scope, non-goals, and required behavior are clear; material questions are resolved; sensitive decisions are explicitly confirmed; assumptions are safe and evidence-backed; criteria are observable; and every important criterion maps to verification. Only explicit human approval permits `draft -> ready`. The agent may recommend approval but cannot grant it.

For an implementation gate, prevent non-trivial implementation when the authoritative specification is missing, conflicted, or still `draft`. Help create or refine it instead of merely refusing. Implementation begins with `ready -> active`; do not invent another status.

For completion, map every requirement and criterion to implementation and actual verification evidence, identify scope or specification drift, run the narrowest sufficient checks and then broader checks warranted by blast radius, and review affected current product, architecture, engineering, security, operational, and AI documentation. Record updated documents and each reviewed-but-unchanged document with a concise reason.

Recommend `active -> done` only when implementation, required tests, current-documentation review, acceptance evidence, limitations, and deferred work are recorded. A material deviation must first be incorporated into the authoritative specification and explicitly approved. An informal approved deviation cannot bypass completion requirements.

An independent completion verifier reads the specification before the diff, reports findings without rewriting code unless asked, and does not treat author verification as independent evidence.

## Lifecycle and boundaries

Use only:

```text
draft -> ready -> active -> done
draft|ready|active -> cancelled
```

Cancellation requires a reason. Blocking, review severity, and verification outcome are metadata, not statuses.

Do not create sessions, conversation transcripts, backlog or sprint structures, role agents, automatic approval, adapters, connectors, networking, persistence, or extra public commands. Do not implement unrelated behavior while creating or refining a specification. Preserve repository-owned content and the boundaries of later specifications.
