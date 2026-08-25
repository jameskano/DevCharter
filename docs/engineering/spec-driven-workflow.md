# Specification-driven workflow

## Purpose

DevCharter creates definitive, discoverable behavior contracts without requiring paperwork for trivial edits.

## When a specification is needed

A new or updated spec is normally required for:

- user-visible or business behavior;
- data models, APIs, or integrations;
- permissions, identity, privacy, payments, deletion, legal behavior, or migrations;
- architecture or public contracts;
- changes with meaningful dependencies, risks, or failure behavior.

Obvious non-behavioral corrections and small maintenance work may proceed without a new full spec when the existing contract remains unchanged.

## Default artifact

Use one cohesive feature specification by default. Do not automatically create separate requirements, design, tasks, acceptance, and test-plan documents.

Split a specification only when size, independent ownership, risk, or implementation sequencing makes the separation useful.

## Workflow

```text
request
→ inspect relevant context and existing behavior
→ find or create the authoritative spec
→ identify confirmed facts, assumptions, and open questions
→ define scope, non-goals, behavior, and risks
→ write observable acceptance criteria
→ map criteria to verification
→ human approval
→ ready → active
→ implement the smallest useful slice
→ verify behavior and critical journeys
→ update or review current documentation
→ record evidence
→ done
```

## Specification content

Include only applicable sections:

- metadata and relationships;
- problem and desired outcome;
- scope and non-goals;
- current and required behavior;
- user/developer flows and important states;
- domain, data, API, integration, security, or migration rules;
- assumptions, open questions, risks, and trade-offs;
- dependencies and affected documentation;
- acceptance criteria;
- verification strategy;
- completion evidence.

## Acceptance criteria

Criteria describe observable starting state, action, and result. Include loading, empty, error, permission, destructive, recovery, and accessibility behavior only where relevant.

Every important criterion maps to practical automated or manual evidence. “Works correctly” is not sufficient.

## Implementation tasks

When a task breakdown is useful, keep each task small:

```text
id
title
reason
scope or affected files
acceptance evidence
dependencies
risks, when material
```

Assignees, estimates, priorities, agent roles, and file locks are optional and must not become default governance.

## Supersession

Keep one authoritative definition per spec ID. When a spec replaces another, record an explicit `supersedes` or `superseded_by` relationship and update the specs index. Do not rely on “where they conflict” prose.

## Completion

A spec is `done` only when implementation, required tests, current documentation review, acceptance evidence, limitations, and deferred work are recorded.
