# SPEC-0002A — Repository Transformation and Shared Foundation

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0002A |
| Parent | SPEC-0002 |
| Status | done |
| Approval | User requested final ready implementation specifications on 2026-09-18 |
| Dependencies | SPEC-0002 |
| Enables | SPEC-0002B, SPEC-0002C, SPEC-0002D |

## Purpose

Transform DevCharter from the superseded TypeScript runtime and CLI into an instruction-, knowledge-,
skill-, and specification-driven tool that an AI coding companion can read from a local folder or
GitHub repository while working on a separate target project.

This specification establishes the new repository architecture and removes obsolete v0 product
surfaces. It does not yet complete the Project Architect methodology or the three native companion
integrations.

## Starting state

The repository currently contains:

- `@devcharter/core`, `@devcharter/adapter-codex`, and `@devcharter/cli` packages;
- a `devcharter` binary and manual JSON lifecycle;
- deterministic discovery, planning, rendering, fingerprint, writer, and validation code;
- package and release tests for that runtime;
- Project Architect and Specification Architect skills;
- current product, architecture, engineering, user, and release documentation;
- completed SPEC-0001A–E evidence.

SPEC-0002 supersedes the product architecture. Git history and completed specifications preserve the
old implementation; the working tree must not retain dead runtime code merely as documentation.

## Required outcome

After completion, the DevCharter repository has no user or target-project runtime, CLI, published
runtime package, JSON lifecycle, deterministic renderer, managed writer, or target-local installation
path. Its root clearly tells a human or AI companion how to use DevCharter from an arbitrary location
against a separately identified target.

The repository contains a coherent shared foundation for:

- Project Architect instructions;
- Specification Architect instructions;
- companion-specific entrypoints;
- project, technology, tool, ecosystem-component, and harness knowledge;
- templates and examples used as guidance rather than unconditional output;
- scenario fixtures and development-only validation of DevCharter-owned assets;
- authoritative specifications and current documentation.

## Scope

### Remove the v0 runtime product

Remove after extracting still-relevant knowledge:

- `packages/core`;
- `packages/adapter-codex`;
- `packages/cli`;
- the `devcharter` executable and its command documentation;
- runtime-oriented workspace configuration and package exports;
- v0 application, rendering, fingerprint, receipt, retry, writer, and JSON-input code;
- runtime unit, integration, release, package, and CLI tests that no longer validate the new product;
- production packing and qualification scripts that exist only for the removed packages;
- dependencies and lockfile entries used only by the removed runtime;
- generated build output if present.

Do not remove:

- completed specifications and v0 qualification evidence;
- product knowledge that must be migrated into current instructions or references;
- reusable safety, discovery, authority, preservation, and verification principles;
- fixtures that can be adapted into instruction-driven scenario tests;
- repository history or evidence needed to explain the transformation.

### Establish the instruction-driven repository structure

Use the minimum coherent structure necessary to separate authority and maintenance. The expected
shape is:

```text
AGENTS.md
README.md
MANIFEST.md
.agents/
└── skills/
    ├── project-architect/
    └── specification-architect/
companions/
├── codex/
├── claude-code/
└── github-copilot/
knowledge/
├── ecosystem/
├── harnesses/
├── technologies/
└── tools/
templates/
├── documentation/
└── specifications/
tests/
├── fixtures/
└── scenarios/
docs/
specs/
references/
```

Exact subpaths may change during implementation when a simpler structure provides the same clear
authority. Do not create empty directories or placeholder files. Every retained or created path must
have a current consumer and maintenance purpose.

### Create a universal entrypoint

The root human and AI entrypoints must explain that the user supplies:

1. `new`, `retrofit`, or `audit`;
2. `full`, `governance`, `engineering`, or `ai`;
3. the DevCharter folder or GitHub repository location;
4. the target-project folder or repository location;
5. initial context in plain text or specification files.

They must route the companion to the correct shared skill and companion-specific guidance without
requiring installation in the target or execution of DevCharter commands.

### Development-only verification

Retain or create only the smallest contributor harness needed to validate DevCharter-owned static
assets. It may use scripts and development dependencies, but it must not become a product runtime or
target dependency.

The harness should validate, as applicable:

- required frontmatter and metadata;
- unique skill and specification identities;
- valid relative references;
- status/path consistency;
- no stale references to removed CLI commands or runtime packages in current documentation;
- companion entrypoint routing;
- scenario fixture completeness;
- formatting and whitespace;
- absence of secrets and generated build output.

Whether the contributor harness uses Node, another existing cross-platform tool, or a smaller
alternative is an implementation detail. The root manifest, lockfile, and CI remain only if current
verification genuinely requires them.

## Migration rules

1. Inspect every v0 file before deletion and classify it as remove, migrate knowledge, retain as
   historical evidence, or adapt into a current scenario.
2. Record the classification in the implementation review so useful rules are not lost silently.
3. Do not transplant TypeScript schemas into Markdown merely to preserve their shape.
4. Convert behavioral knowledge into concise authoritative instructions, decision criteria, or
   scenarios owned by SPEC-0002B or later work.
5. Keep completed SPEC-0001A–E unchanged except for relationship metadata or references needed to
   establish historical authority.
6. Replace current documentation claims only when the corresponding new path exists.
7. Do not claim that the new Project Architect or companion integrations are complete in this slice.

## Safety and repository integrity

- Resolve exact deletion targets before removal.
- Preserve unrelated or externally changed files.
- Do not delete specifications, release records, or reference material without an explicit
  supersession reason.
- Keep changes reviewable; separate bulk runtime removal from newly authored methodology when that
  materially improves review.
- Run reference and formatting checks after path moves.
- Ensure no current instructions route future contributors back to removed commands.

## Implementation tasks

### A1. Inventory and migration map

Classify every current runtime, test, script, configuration, documentation, skill, and reference path.
Record retained knowledge destinations and deletion rationale.

### A2. Static target architecture

Create the smallest required directory and authority structure, universal entrypoint, and current
manifest/index routing.

### A3. Remove runtime surfaces

Delete the three runtime packages, CLI, package qualification flow, and obsolete runtime tests and
configuration. Simplify the root development setup based on remaining static validation needs.

### A4. Preserve historical authority

Keep SPEC-0001A–E and v0 release evidence clearly historical, link them from the new authority map,
and prevent them from being mistaken for current behavior.

### A5. Establish contributor checks

Implement and document the narrow static verification surface required by this specification.

## Acceptance criteria

1. No `devcharter` product executable or user-facing CLI command remains.
2. `@devcharter/core`, `@devcharter/adapter-codex`, and `@devcharter/cli` no longer exist as runtime
   packages.
3. No current documentation instructs users to install tarballs, create lifecycle JSON, copy
   fingerprints, render a plan, or run apply.
4. DevCharter can be referenced from a local folder or GitHub repository independently of the target
   location.
5. A human or companion entering the repository can identify the five required invocation inputs and
   the correct next instruction source.
6. The new structure distinguishes shared methodology, companion-native guidance, knowledge,
   templates, scenarios, current documentation, and historical specifications.
7. Every retained v0 source of useful knowledge has an explicit current destination or recorded
   historical-only disposition.
8. Completed SPEC-0001A–E and release evidence remain accessible and are not presented as current
   product authority.
9. Development-only verification does not become a target dependency or product runtime.
10. Current references resolve, specification IDs are unique, and status/path relationships are
    valid.
11. No empty scaffold, unused abstraction, or placeholder catalog is added.
12. Formatting, repository integrity checks, and whitespace validation pass.

## Verification

- repository path inventory before and after transformation;
- stale runtime/CLI reference search over current sources;
- reference and specification-authority validation;
- static skill/frontmatter validation;
- formatting and whitespace checks;
- clean-environment walkthrough in which the DevCharter and target locations are different;
- diff review mapping every removed path to its migration classification.

## Documentation impact

Update in this slice:

- `AGENTS.md` repository implementation instructions;
- `README.md` current product status and entrypoint;
- `MANIFEST.md` authority and reading order;
- `docs/product/purpose-and-scope.md`;
- `docs/architecture/system-overview.md`;
- `docs/user-guide.md` enough to remove the obsolete CLI journey;
- `CHANGELOG.md` with the breaking architectural transition.

Review and defer detailed methodology or provider-native instructions to SPEC-0002B and SPEC-0002C
without presenting them as complete.

## Completion gate

Do not mark SPEC-0002A `done` until the runtime removal and knowledge-migration map are complete, the
new static architecture and entrypoint are usable, current documentation contains no operative CLI
path, contributor checks pass, SPEC-0001 history remains accessible, every acceptance criterion has
evidence, and an independent review finds no important knowledge loss or authority conflict.

## Implementation evidence

Implementation and independent completion review finished on 2026-09-18.

| AC | Evidence |
|---|---|
| 1–3 | The three package trees, executable, runtime scripts/tests/configuration, lockfile, and operative CLI documentation were removed. `scripts/validate-assets.mjs` rejects removed package directories and operative runtime instructions in current sources. |
| 4–5 | `README.md` defines the five inputs, separate source/target locations, example invocation, and routing to companion entrypoints and the Project Architect skill. The automated clean-environment walkthrough stages distinct temporary source and target roots, resolves the Codex-to-skill route, and proves the target hash is unchanged. |
| 6 | `MANIFEST.md` and the root repository map distinguish skills, companion routing, knowledge, optional templates, scenarios, current documentation, references, and historical specifications. Each created path has a named consumer. |
| 7 | `docs/architecture/v0-migration-map.md` classifies every pre-transformation tracked path group and generated-output category as remove, migrate, retain, or adapt, with its destination or rationale. |
| 8 | SPEC-0001, SPEC-0001A–E, v0 qualification, and the Habit Compass pilot remain. Current authority maps and historical banners prevent them from presenting current behavior. |
| 9 | The private root manifest has no dependencies, exports, binary, or workspace. Its Node script checks repository assets only; README and AGENTS prohibit target installation or execution. |
| 10 | The validator checks relative Markdown links, unique skill/spec IDs, parent/dependency/enable/supersession relationships, and status/path consistency. |
| 11 | Only consumed routing, knowledge, template, scenario, fixture, migration, and validation files were created; the expected-but-unused catalog subdirectories were not scaffolded. |
| 12 | Static validation on Node 24.18.0 and `git diff --check` pass. The validator also checks final newlines, trailing whitespace, generated output, secret signatures, and contributor-manifest boundaries. |

### Verification results

- `C:\Users\iajer\AppData\Local\nvm\v24.18.0\node.exe scripts/validate-assets.mjs` — pass on
  Node v24.18.0: 35 Markdown files, 11 specifications, 2 skills, and the clean separate-location
  walkthrough validated.
- `npm test` and `npm run format:check` with Node v24.18.0 — pass; both invoke the same
  dependency-free static asset check exposed for contributors and CI.
- `git diff --check` — pass with no output.
- Stale-surface search over current instructions and documentation — no operative match; remaining
  runtime/package terms occur only in the governing removal specifications and migration history.
- Repository inventory review — only the user-activated move of this specification predated the
  implementation; no unrelated user change was overwritten.

### Documentation review

Updated: `AGENTS.md`, `README.md`, `MANIFEST.md`, product purpose, system overview, user guide,
changelog, specification index, both shared skills, and the Codex capability note. Added the v0
migration map. The quality/decision model and specification workflow were reviewed unchanged because
they were already implementation-independent. Historical release records were preserved with clear
banners rather than rewritten.

### Limitations and deferred work

- The three companion files are honest routing entrypoints, not completed native integrations.
- Lint, type-check, and build commands are not applicable after removal of executable source and
  generated product output; the retained JavaScript is exercised directly by the static check.
- Detailed Project Architect methodology and knowledge organization remain SPEC-0002B work.
- Native companion assets/qualification remain SPEC-0002C work; full lifecycle/release qualification
  remains SPEC-0002D work.
- A final fresh-context, read-only review reported `PASS` with no blocking, important, or advisory
  repository findings and recommended the `active` to `done` transition.
