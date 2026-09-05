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

SPEC-0001A provides the deterministic core foundation. Completed SPEC-0001B adds the read-only
Project Architect commands:

```bash
devcharter new [--scope full|governance|engineering|ai]
devcharter retrofit [--scope full|governance|engineering|ai]
devcharter audit [--scope full|governance|engineering|ai]
devcharter inspect
devcharter validate
```

All commands operate on the current working directory and support `--format human|json`. The three
Project Architect modes are deterministically read-only. New and retrofit infer strong repository
evidence, infer a documented current outcome when confidence is adequate, ask only unresolved
material questions, and return actionable unapproved proposals bound to complete proposal and
repository fingerprints. Fingerprint algorithm version 2 includes canonical approval-relevant
exclusion metadata without hashing excluded contents. Audit returns the same stable analysis sections
without a proposal, approval state, or planned changes. Human and JSON results expose facts,
findings, assumptions, questions, critical journeys, considered components, planned changes,
preserved paths, conflicts, risks, validation, deferred work, and zero applied changes. Approval is
an in-memory library contract; unresolved required questions, audit-mode proposals, replay, stale
repository state, and material proposal mutations are rejected. Rendering and file application
remain deferred to SPEC-0001D. Active SPEC-0001C adds the v0 Specification Architect as one
instruction-only repository skill at `.agents/skills/specification-architect/SKILL.md`; it adds no
CLI command, runtime API, session, persistence, adapter, or generator.

Discovery classifies JavaScript/TypeScript, Python, Rust, Go, Java, and Kotlin source and tests.
Root and manifest-backed `vendor` directories are dependency boundaries; unproven nested `vendor`
directories remain project content and participate in preservation and approval fingerprints.
Command checks are intentionally bounded to package scripts for npm, pnpm, yarn, and bun; static
Python declarations and common Python verification tools; and standard Cargo, Go, and Maven
verification commands. Unfamiliar or dynamic commands are reported as uncertainty. Explicitly
third-party skills identified by an explicit package marker or an unambiguous version-1
`skills-lock.json` entry remain inventoried but are excluded from project facts, findings,
references, recommendations, and fingerprints. Runtime-AI facts use bounded declared-dependency and explicit
source-import evidence across the supported ecosystems; dependency-only evidence remains
unconfirmed. Semantic-inspection reporting includes only paths interpreted by a defined analyzer,
not every enumerated, loaded, or fingerprinted source. Developer journeys prefer an authoritative
root aggregate, CI, or root verification workflow over redundant package builds; user journeys
require explicit current documentation or E2E evidence. Human output previews at most 20 preserved
paths while JSON retains the complete list.

AI-scoped fingerprints bind canonical imports that match declared supported AI dependencies, so
runtime-AI fact changes invalidate approval while unrelated source-body edits remain stable.
Constraint and risk questions require contextual requirements or concrete failure evidence; generic
product-domain vocabulary continues to use the explicit non-blocking empty defaults.

From this workspace, run commands with `pnpm devcharter`, for example
`pnpm devcharter audit --scope engineering --format json`.

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
2. Read the parent specification and completed `SPEC-0001A` and `SPEC-0001B` foundations.
3. Preserve the clean-slate architecture and public contracts established by 0001A and 0001B.
4. Complete active `SPEC-0001C` without adding 0001D or 0001E behavior.
5. Move 0001C to `done` only after author verification, a fresh independent completion review,
   and explicit user approval.
6. Repeat for 0001D and 0001E.
7. Use Habit Compass as an external audit/retrofit pilot before a stable release.

Use only these development statuses:

```text
draft → ready → active → done
          ↘       ↘
           cancelled
```

Temporary blockers are recorded separately.
