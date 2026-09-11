# DevCharter

DevCharter is a local, model-neutral package that creates or improves the AI-assisted development ecosystem of a software repository.

Its value is not the number of generated files. Its value is deciding what the repository needs, what it already has, what should be preserved, and how the resulting setup can be verified.

## Product promise

> Give a repository the smallest, safest, and most useful AI development system it actually needs.

The v0 flow is:

```text
discover → understand → answer → propose → approve → render → approve → apply → verify
```

## Current implementation

SPEC-0001A provides the deterministic core foundation, completed SPEC-0001B adds the read-only
Project Architect workflow, and completed SPEC-0001D adds rendering and application. The current
CLI surface is:

```bash
devcharter new [--scope full|governance|engineering|ai] [--decisions <file>] [--previous-proposal <file>]
devcharter retrofit [--scope full|governance|engineering|ai] [--decisions <file>] [--previous-proposal <file>]
devcharter audit [--scope full|governance|engineering|ai]
devcharter inspect
devcharter validate
devcharter render --proposal <file> --approval <file> --adapter codex
devcharter apply --plan <file> --approval <file>
```

All commands operate on the current working directory and support `--format human|json`. The three
Project Architect modes are deterministically read-only. New and retrofit infer strong repository
evidence, infer a documented current outcome when confidence is adequate, ask only unresolved
material questions, and return actionable unapproved proposals bound to complete proposal and
repository fingerprints. Fingerprint algorithm version 2 includes canonical approval-relevant
exclusion metadata without hashing excluded contents. Audit returns the same stable analysis sections
without a proposal, approval state, or planned changes. Human and JSON results expose facts,
findings, assumptions, questions, critical journeys, considered components, planned changes,
preserved paths, conflicts, risks, validation, deferred work, and zero applied changes. Canonical
decision files let the CLI answer those questions without adding sessions or persisted interview
state. Optional previous proposals continue the existing revision contract. Approval is a
fingerprint-bound contract; unresolved required questions, audit-mode proposals, stale repository
state, and material proposal mutations are rejected. Completed SPEC-0001D adds read-only `render` and
writer-capable `apply` lifecycle commands with structurally separate approvals. When an engineering
proposal needs to create or repair a `package.json` verification surface, DevCharter requires an
explicit `project.packageScripts` decision before rendering. It creates only the accepted scripts in
a new manifest, or surgically updates the `scripts` object of a strict JSON manifest while preserving
unrelated fields and existing script order. Render output exposes the complete content or diff in
both human and JSON formats. Apply output reports a terminal result for every target and, when
applicable, the managed receipt: `created`, `updated`, `skipped`, `conflict`, `failed`, or
`not-attempted`. Completed SPEC-0001C adds the v0 Specification Architect as one
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
references, recommendations, and fingerprints. Version-1 locks may use DevCharter `path`/`source`
entries or installer-style `source`/`sourceType`/`computedHash` entries with an optional safe relative
`skillPath`; entries are validated independently and installer hashes are not presented as verified
content integrity. Runtime-AI facts use bounded declared-dependency and explicit source-import
evidence across the supported ecosystems; dependency-only evidence remains
unconfirmed. Semantic-inspection reporting includes only paths interpreted by a defined analyzer,
not every enumerated, loaded, or fingerprinted source. Developer journeys prefer an authoritative
root aggregate, CI, or root verification workflow over redundant package builds; user journeys
require explicit current documentation or E2E evidence. Human output previews at most 20 preserved
paths while JSON retains the complete list.

AI-scoped fingerprints bind canonical imports that match declared supported AI dependencies, so
runtime-AI fact changes invalidate approval while unrelated source-body edits remain stable.
Constraint and risk questions require contextual requirements or concrete failure evidence; generic
product-domain vocabulary continues to use the explicit non-blocking empty defaults.

Rendered plans carry a compact versioned retry digest over bounded repository evidence and explicit
Git state. An already-applied retry is accepted only when that capture is exact and every planned
output already matches; unreadable, unsupported, binary, oversized, or otherwise uncertain evidence
forces a fresh proposal and approval.

From this workspace, run commands with `pnpm devcharter`, for example
`pnpm devcharter audit --scope engineering --format json`.

## Installation from qualified local tarballs

DevCharter v0 targets Node.js 22 or later and pnpm 10. Pack and install all three packages together;
the workspace root remains private and v0 does not publish to a registry.

```bash
mkdir release-artifacts
pnpm --dir packages/core pack --pack-destination ../../release-artifacts
pnpm --dir packages/adapter-codex pack --pack-destination ../../release-artifacts
pnpm --dir packages/cli pack --pack-destination ../../release-artifacts

cd ../target-repository
pnpm add ../DevCharter/release-artifacts/devcharter-core-0.1.0.tgz \
  ../DevCharter/release-artifacts/devcharter-adapter-codex-0.1.0.tgz \
  ../DevCharter/release-artifacts/devcharter-cli-0.1.0.tgz
pnpm exec devcharter --version
```

`pnpm package:qualify` performs the authoritative temporary tarball inspection, fresh installation,
packaged-asset check, installed lifecycle, validation, and exact retry no-op check.

## Complete installed-CLI lifecycle

Create a canonical decision file using the question IDs returned by the first read-only proposal.
For an AI-only new repository, for example:

```json
[
  { "id": "project.outcome", "value": "Ship a dependable local tool" },
  { "id": "project.aiTools", "value": ["Codex"] },
  { "id": "project.constraints", "value": [] },
  { "id": "project.risks", "value": [] }
]
```

Run the lifecycle with JSON artifacts. The proposal and render commands accept the complete
successful envelope from the preceding command, so no extraction script is needed.

```bash
pnpm exec devcharter inspect --format json
pnpm exec devcharter new --scope ai --decisions decisions.json --format json > proposal.json
```

Review the proposal, then create the first approval from its proposal revision, proposal
fingerprint, and repository fingerprint:

```json
{
  "stage": "abstract",
  "confirmed": true,
  "proposalRevision": 1,
  "proposalFingerprint": "<proposal fingerprint>",
  "repositoryFingerprint": "<repository fingerprint>"
}
```

```bash
pnpm exec devcharter render --proposal proposal.json --approval abstract-approval.json --adapter codex --format json > plan.json
```

Review the complete rendered content or diff, then create the independent write approval using the
rendered plan's revision and fingerprints:

```json
{
  "stage": "write",
  "confirmed": true,
  "proposalRevision": 1,
  "renderedFingerprint": "<rendered fingerprint>",
  "repositoryFingerprint": "<repository fingerprint>"
}
```

```bash
pnpm exec devcharter apply --plan plan.json --approval write-approval.json --format json
pnpm exec devcharter validate --format json
```

If answers change, pass the prior successful proposal envelope with `--previous-proposal` to receive
the appropriate next proposal revision. Keep lifecycle input files outside the target repository so
creating them does not stale its repository fingerprint.

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
2. Read the parent specification and completed `SPEC-0001A`, `SPEC-0001B`, and `SPEC-0001C`
   foundations.
3. Preserve the clean-slate architecture and public contracts established by 0001A–C.
4. Treat completed `SPEC-0001D` behavior as authoritative.
5. Implement active `SPEC-0001E` using its approved release decisions.
6. Complete 0001E without revisiting completed behavior unless failing release evidence requires a compatible fix.
7. Use Habit Compass as an external audit/retrofit pilot before a stable release.

Use only these development statuses:

```text
draft → ready → active → done
          ↘       ↘
           cancelled
```

Temporary blockers are recorded separately.
