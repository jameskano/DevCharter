# Project Architect recipes

These are adaptable review aids, not mandatory output. Populate them only from repository evidence
and accepted decisions. Preserve native conventions, omit irrelevant sections, and never invent
commands, versions, URLs, identities, dates, credentials, or secret-like examples.

## Project brief and current truth

- Desired outcome and explicit non-goals
- Users and critical journeys
- Selected technologies and evidence
- Authoritative product, architecture, engineering, and operational sources
- Confirmed constraints, accepted decisions, assumptions, conflicts, and open questions
- Verified setup, run, and validation commands, or an explicit unresolved command need

Keep current truth separate from historical decisions. Link to authority instead of copying it.

## Proposal

1. Repeat the five verified inputs and desired outcome.
2. Summarize discovery evidence and unresolved conflicts.
3. Use a component table with: path/component, ownership, evidence, decision, reason, maintenance,
   risk, and approval dependency.
4. Describe proposed structure, initializer/dependency effects, sensitive or network effects, and
   preservation rules.
5. Map critical journeys to planned harnesses and observable evidence.
6. List considered-and-rejected components and deferred product features.
7. State the intended one-spec plan or why multiple specifications are materially clearer.
8. Ask for explicit proposal approval and state that it authorizes draft Markdown planning only.

## Parent or implementation specification

Use a parent specification only when several independently approvable implementation specifications
need stable shared authority. Otherwise use one implementation specification. Record metadata and
relationships, problem/outcome, scope/non-goals, current/required behavior, facts and decisions,
constraints and sequence, material risks and recovery, observable criteria, verification mapping,
documentation impact, readiness gate, and completion evidence. The
[implementation template](specifications/implementation-spec.md) is the concise default.

## Repository instructions

Keep one concise root authority where possible:

- purpose and product boundary;
- source-of-truth reading order;
- repository-native setup/run/verify commands actually present;
- spec and approval gates;
- preservation, security, and documentation expectations;
- subtree routing links where rules genuinely differ.

Do not duplicate project documentation, enumerate generic best practices, or create nested
instruction files without a distinct local rule.

## Skill authoring

A skill needs a stable repeated procedure, a clear trigger, compact instructions, maintained source
links, explicit safety boundaries, and a named verification method. Keep ordinary knowledge in docs
and project facts in project-owned authority. Do not create role skills or one skill per framework.

## Verification matrix

| Criterion | Starting state/action/result | Evidence source | Planned check | Actual result/skip |
|---|---|---|---|---|

Use exact repository commands only after verifying their authority. Include journey evidence where
isolated checks cannot prove the criterion.

## Completion evidence

- changed and preserved paths, plus ownership/conflict decisions;
- criterion-to-implementation-and-evidence mapping;
- actual commands/actions, results, failures, timeouts, and skips;
- critical-journey evidence and cleanup result;
- documentation updated and documentation reviewed but unchanged, with reasons;
- limitations, external changes, partial/unattempted work, and deferred items;
- reviewable diff and whether the completion gate is satisfied.
