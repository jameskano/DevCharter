# DevCharter manifest and authority map

## Purpose

This repository contains the static instructions, knowledge, specifications, templates, scenarios,
and contributor checks used by an AI coding companion to apply DevCharter to a separate target.
There is no DevCharter product runtime or target-local installation.

## Reading order

1. `AGENTS.md`
2. `README.md`
3. `docs/product/purpose-and-scope.md`
4. `docs/architecture/system-overview.md`
5. `docs/engineering/quality-and-decision-model.md`
6. `docs/engineering/spec-driven-workflow.md`
7. `specs/README.md`
8. `specs/approved/SPEC-0002-companion-driven-devcharter.md`
9. the one current active implementation specification and its direct dependencies
10. `.agents/skills/project-architect/SKILL.md` for repository ecosystem work
11. `.agents/skills/specification-architect/SKILL.md` for approved detailed planning
12. `knowledge/shared-foundation.md`
13. `knowledge/companion-integration-contract.md` and the selected entrypoint under `companions/`
14. applicable templates, scenarios, and dated capability references
15. `CONTRIBUTING.md` and `docs/release/companion-driven-qualification.md` for maintenance and
    release evidence

Historical v0 context is consulted only when migration history or prior evidence is relevant:

- `specs/approved/SPEC-0001-devcharter-v0.md`;
- `specs/done/SPEC-0001A-core-foundation-and-canonical-model.md` through `SPEC-0001E`;
- `docs/release/v0-qualification.md` and `docs/release/habit-compass-pilot.md`;
- `docs/architecture/v0-migration-map.md`.

## Authority

1. Current user instruction.
2. Applicable approved parent specification and the one active implementation specification.
3. Accepted project decision.
4. Current product, architecture, and engineering documentation.
5. Shared skills, knowledge, templates, and scenarios.
6. Retained historical evidence.

Repository files are authoritative over conversation history or imported examples. A historical
specification may explain a decision but cannot restore superseded runtime behavior.

## Current architecture

- `AGENTS.md` owns repository-wide implementation constraints.
- `.agents/skills/` owns shared repeatable procedures.
- `companions/` routes supported companions to the shared sources and contains the minimal Claude
  local plugin; native adapters remain thin and the integration contract makes them testable.
- `knowledge/` owns implementation-neutral shared rules.
- `templates/` provides optional guidance, never unconditional output.
- `tests/fixtures/` and `tests/scenarios/` provide development-only static validation inputs.
- `docs/` contains current documentation, completed qualification, and explicitly labelled
  historical release evidence.
- `CONTRIBUTING.md` defines safe knowledge, adapter, scenario, and qualification maintenance.
- `package.json` records the repository version and contributor-only verification commands.
- `specs/approved/SPEC-0002-companion-driven-devcharter.md` is current product authority.
- `specs/active/` contains at most one implementation specification.
- `scripts/validate-assets.mjs` is a contributor check, not a product or target runtime.

## Current implementation sequence

SPEC-0002A through SPEC-0002E are ordered and done. SPEC-0002E refines optional native Plan-mode
proposal work, material questioning, and durable specification handoff without changing the static
architecture. No implementation specification is currently active.

The stable public vocabulary is:

```text
Modes: new, retrofit, audit
Scopes: full, governance, engineering, ai
Statuses: draft, ready, active, done, cancelled
```

Blocking is metadata, not a status. `audit` is read-only. New and retrofit require proposal approval,
detailed Markdown specification work, and separate specification approval before implementation.
