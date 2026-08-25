# DevCharter

DevCharter is a local, model-neutral package that creates or improves the AI-assisted development ecosystem of a software repository.

Its value is not the number of generated files. Its value is deciding what the repository needs, what it already has, what should be preserved, and how the resulting setup can be verified.

## Product promise

> Give a repository the smallest, safest, and most useful AI development system it actually needs.

The target v0 flow is:

```text
discover → understand → propose → approve → apply → verify
```

## Current implementation

SPEC-0001A provides the deterministic core foundation and exposes only:

```bash
devcharter inspect
devcharter validate
```

Both commands operate on the current working directory, support `--format human|json`, and are read-only. From this workspace, run them with `pnpm devcharter inspect` or `pnpm devcharter validate`.

The complete v0 product will support these modes after SPEC-0001B:

```bash
devcharter new
devcharter retrofit
devcharter audit
```

Each mode supports:

```text
full
governance
engineering
ai
```

## Modes

### `new`

Proposes a lightweight foundation for a new or lightly initialized repository from its intended product, technology, risks, and development needs.

### `retrofit`

Analyzes an existing repository and proposes targeted improvements without replacing useful conventions or files blindly.

### `audit`

Performs a read-only review of the selected scope. It reports missing, conflicting, obsolete, overlapping, broken, or unjustified elements and recommends follow-up work.

## Scopes

- `full`: governance, engineering, and AI.
- `governance`: project truth, specifications, decisions, and documentation synchronization.
- `engineering`: commands, tests, CI, safety, and development foundations needed for reliable AI work.
- `ai`: repository instructions, skills, selected adapters, and other AI configuration only when justified.

Architecture, security, privacy, accessibility, reliability, maintainability, performance, cost, and operations are evaluated inside the applicable scope rather than exposed as more scopes.

## Minimum output

DevCharter may recommend only a concise `AGENTS.md`, an existing verification command, and a specification convention. A complex repository may justify more.

Possible outputs include:

- concise repository instructions;
- compact project context and definitive specifications;
- stable repeatable skills;
- appropriate engineering and verification foundations;
- a Codex adapter generated from shared project knowledge.

Role-agent fleets, prompt libraries, hooks, MCP integrations, CI, and additional tools are never default requirements.

## Specification set

1. `SPEC-0001` — DevCharter v0
2. `SPEC-0001A` — Core foundation and canonical model
3. `SPEC-0001B` — Project Architect workflow
4. `SPEC-0001C` — Specification Architect
5. `SPEC-0001D` — Ecosystem generator and Codex adapter
6. `SPEC-0001E` — Validation and release readiness

## Codex implementation order

1. Read `AGENTS.md` and `MANIFEST.md`.
2. Read the parent specification and active `SPEC-0001A`.
3. Confirm the clean-slate decision and current active specification.
4. Implement and complete 0001A without inheriting an old public API.
5. Review 0001A independently and move it to `done` only with evidence.
6. Move 0001B from `ready` to `active`; implement and review it.
7. Repeat for 0001C, 0001D, and 0001E.
8. Use Habit Compass as an external audit/retrofit pilot before a stable release.

Use only these development statuses:

```text
draft → ready → active → done
          ↘       ↘
           cancelled
```

Temporary blockers are recorded separately.
