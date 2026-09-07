# SPEC-0001D — Ecosystem Generator and Codex Adapter

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0001D |
| Parent | SPEC-0001 |
| Status | active |

## Purpose

Render and safely apply the approved minimum-sufficient ecosystem proposed by the Project Architect.

Fully support Codex in v0 while keeping the analysis and proposal contracts model-neutral.

## Inputs

- approved current proposal revision;
- mode and scope;
- evidence-backed project facts;
- accepted decisions and constraints;
- current repository fingerprint/state;
- planned file changes;
- selected adapter;
- ownership, provenance, and merge information;
- validation plan.

## Planned file contract

Before writing, every target is represented as:

```text
path
action: create | update | skip | conflict
purpose
reason
origin/ownership
adapter
proposed content or diff
validation expectations
```

The user can review exactly what will happen.

SPEC-0001B supplies the same `PlannedFileChange` records at the abstract proposal stage, where
content, diff, and adapter are optional. Before any SPEC-0001D application, create/update records
must be narrowed to rendered changes containing proposed content or a reviewable diff and the
selected adapter where applicable. Rendering changes approval-relevant proposal content, so the
rendered proposal receives a new fingerprint and explicit write approval; abstract approval from
SPEC-0001B cannot be replayed as write approval.

Approval records are fingerprint-bound authorizations rather than single-use tokens. Reusing an
abstract approval to reproduce the identical rendered plan is valid while the proposal, revision,
adapter, rendered inputs, and repository state remain unchanged. Abstract and write approvals use
structurally incompatible stage discriminants. DevCharter stores no nonce, approval history,
used-approval registry, session, or hidden state.

## Public lifecycle commands and import boundary

```text
devcharter render --proposal <file> --approval <file> --adapter codex [--format human|json]
devcharter apply --plan <file> --approval <file> [--format human|json]
```

`render` verifies approval of the exact abstract proposal and emits a complete reviewable rendered
plan without writing. `apply` verifies a write-stage approval bound to that rendered plan and is the
only command allowed to reach the atomic writer. These are lifecycle commands, not additional modes.

Core exposes separate read-only rendering and writer-capable application subpaths. The root core
export, rendering subpath, Codex adapter, and every CLI command other than `apply` must remain outside
the writer-capable import graph. The CLI dynamically loads application only after parsing `apply`.
Library callers may use the application subpath, which enforces the same approval, fingerprint,
adapter, path, drift, conflict, and preflight checks as the CLI.

## Minimum generation rule

Generate only approved artifacts that satisfy a detected current need.

DevCharter may conclude that:

- the existing setup is sufficient;
- an existing command should be reused;
- only `AGENTS.md` needs improvement;
- a spec convention is enough;
- no skill, agent, prompt, hook, MCP, CI, or new dependency is required.

The proposal records considered and rejected components.

## Governance output

Depending on scope and need, generate or improve concise current project context, an authoritative specs index, a cohesive feature-spec template, and the minimum documentation needed to make important behavior discoverable.

Do not create large empty directory trees, placeholder documents, or multiple policy/profile files without near-term use.

## Engineering output

Only when missing and justified, generate or improve:

- runtime or package-manager configuration;
- formatting, linting, or type checking;
- focused test foundations;
- build and verification commands;
- CI;
- security/dependency checks;
- environment examples;
- relevant operational documentation.

Every new harness states what it protects, how to run it, and its maintenance cost. Do not install deferred infrastructure “for later.”

When a proposal needs to create or repair a `package.json` verification surface, rendering requires
an accepted `project.packageScripts` mapping. Script names must be trimmed, non-empty, free of control
characters, and must not be `__proto__`, `prototype`, or `constructor`. Script bodies must be
non-blank, single-line strings without NUL or line-control characters. Ordinary npm punctuation and
shell metacharacters are allowed. New manifests contain only the accepted scripts; existing strict
JSON manifests are updated surgically, preserving unrelated fields and existing script order while
appending new accepted scripts deterministically. Malformed JSON, JSONC, duplicate relevant keys, or
a non-object root or `scripts` value is a conflict rather than a guessed rewrite.

## AI output

Depending on need:

- root or genuinely scoped nested `AGENTS.md`;
- Project Architect and Specification Architect skills;
- selected supported Codex configuration;
- other AI artifacts only when explicitly justified.

Do not generate a role-agent fleet or reusable prompt library by default. Historical one-off implementation prompts belong in specs or planning records rather than permanent project AI infrastructure.

## Codex adapter

The adapter follows official OpenAI documentation and may generate:

```text
AGENTS.md
nested AGENTS.md files when scope differs
.agents/skills/<skill-name>/SKILL.md
.codex/configuration only when officially supported and required
```

Rules:

- keep root instructions concise and durable;
- link to deeper project docs rather than copy them;
- put stable repeatable procedures in skills;
- use concise valid skill frontmatter and focused supporting resources;
- preserve third-party skill provenance;
- do not place project skills under an invented `.ai/skills` convention;
- do not generate `AGENTS.override.md` as ordinary permanent project setup;
- do not emit custom-agent formats unless current official Codex support and the approved proposal justify them.

## Existing-file strategy

For each existing target:

1. inspect content and origin;
2. identify the applicable source of truth;
3. classify ownership;
4. compare semantically, not only by file existence;
5. create a reviewable diff;
6. preserve useful project rules;
7. report unresolved conflicts;
8. require approval before replacement.

No silent overwrite and no repeated dated append sections.

## Ownership and drift

Starter documentation becomes project-owned after application unless the proposal explicitly marks a file as managed.

For managed files, a small receipt may store path, adapter, baseline hash, and managed state. If the current content diverges from the baseline, report drift and require a merge decision.

Managed metadata is opt-in at `.devcharter/managed-files.json`. Its absence is valid when creating
the first explicitly approved managed artifact, and a new managed target with expected absence needs
no prior receipt entry. Adopting an existing project-owned file as managed requires an explicit
approved ownership change whose baseline equals the current content hash. Missing receipt data is a
drift conflict only when the rendered plan claims an already-managed target or expects an existing
receipt baseline. A missing or malformed receipt is never reconstructed, replaced, or reset silently.

Generated-region markers are exceptional. Prefer whole-file ownership or semantic merging.

## Application safety

- Verify the approved proposal fingerprint before applying.
- Reject paths outside the repository root.
- Prepare all content before writes where practical.
- Use atomic replacement.
- Record exactly what changed.
- Stop safely on conflicts or invalid state.
- Never claim full rollback unless it was actually verified.
- Report partial application accurately.

All conflicts and precondition failures are found before the first write. For updates, preserve the
existing BOM, dominant line-ending style, and terminal-newline convention unless the approved plan
explicitly requests normalization. New text uses the detected project convention, falling back to
UTF-8 without BOM and LF. Semantic merging must not introduce unrelated whole-file formatting churn.

Application performs only structural validation in this specification. It does not execute project
commands, CI, or arbitrary shell input.

Application reports one terminal result for every plan target and for a planned managed receipt:
`created`, `updated`, `skipped`, `conflict`, `failed`, or `not-attempted`. Preflight collects every
detectable problem before writing. If a write fails, remaining writes are `not-attempted`, exact
changed paths are retained, and the result states that rollback was not performed. Human output must
carry the same lifecycle facts as JSON; human render includes deterministic complete target content
or diffs, and human apply includes target and receipt results, validation, failures, and changed paths.

## Idempotency

For unchanged inputs and repository state:

- the rendered plan is stable;
- a second application creates no material diff;
- no duplicate sections or files appear;
- existing adequate content remains skipped;
- audit-related code paths cannot invoke the writer.

If the approved pre-application repository fingerprint still matches, apply performs normal
preflight and application. If it differs, apply returns `already-applied` with zero writes only when
every writable target and the managed receipt exactly match the rendered plan and a new compact,
versioned retry digest exactly matches the digest captured at render time. The digest hashes bounded
readable files and includes explicit normalized Git HEAD/status state. It records metadata, not
contents, for symlinks and excluded, unreadable, binary, oversized, or unsupported entries; any such
uncertain capture is inexact and cannot authorize `already-applied`. Planned targets, the receipt, and
ordinary parent directories are excluded from the filesystem and Git comparison. Partial
application, unrelated repository or Git changes, missing output, or any other difference is stale
and requires a fresh proposal, render, and approval. An old approval is never used to complete a
partial application.

## Distributable adapter assets

Checked-in repository skills are the human-maintained canonical sources. Build or package
preparation copies required sources into package-local adapter assets through one deterministic
single-source process. The installed adapter loads only its package-local assets at runtime and does
not read the DevCharter repository root. Asset parity and root-independent loading are tested here;
full fresh-install qualification remains in SPEC-0001E.

## Future adapters

Define a small adapter contract for future Claude Code or GitHub Copilot support, but do not implement their full native surfaces in v0.

## Non-goals

- Hosted distribution or marketplace.
- Full multi-vendor implementation.
- Automatic external authorization.
- Protected-branch writes.
- Generic technology templates unrelated to detected need.
- Mandatory `.ai/` project profiles.
- Managed ownership of every generated starter file.

## Acceptance criteria

1. Generation consumes only an approved, current proposal revision.
2. Every target is planned as create/update/skip/conflict before writes.
3. Every generated artifact has a project-specific purpose and reason.
4. Empty documentation forests and unnecessary components are not generated.
5. Existing commands and conventions are reused when sufficient.
6. Codex output uses supported native instruction and skill paths.
7. `AGENTS.md` stays concise and detailed repeatable workflows live in skills.
8. Role-agent and prompt libraries are absent unless explicitly justified.
9. Third-party skill provenance is preserved.
10. Existing files are safely preserved, updated, skipped, or reported as conflicts.
11. Starter files become project-owned unless explicitly managed.
12. Managed-output receipts contain no secrets or conversation/session data.
13. Output is deterministic and repeated application is a no-op.
14. Audit paths are unable to write.
15. Partial failures and conflicts are reported accurately.
16. Tests cover new generation, retrofit merge, native Codex layout, stale approval, conflict, drift, idempotency, and failure safety.
17. Writer-capable imports are reachable only through the dedicated application subpath and the parsed CLI `apply` branch.
18. Retry distinguishes an exact already-applied state from partial application, unrelated change, drift, and stale state without persistent approval history.
19. Updates preserve BOM, line endings, terminal-newline convention, and unrelated content unless approved normalization says otherwise.
20. Packaged Codex assets match their canonical repository sources and load without repository-root skill access.
21. A required `package.json` verification surface is rendered only from a valid accepted `project.packageScripts` decision and preserves unrelated strict-JSON manifest content.
22. Human render/apply output has semantic parity with JSON, and every target plus any planned receipt has an accurate terminal result.

## Implementation and author verification

Implementation corrected on 2026-09-07. This specification remains `active`; moving it to `done`
requires a fresh independent completion review and explicit user approval.

| Criterion | Implementation evidence | Verification evidence | Result |
| --- | --- | --- | --- |
| AC1 | `renderProposal` validates the abstract approval through the existing proposal approval contract. | Rendering and CLI lifecycle tests. | Pass |
| AC2 | Rendering resolves every proposed target to create, update, skip, or conflict before application. | Rendering, conflict, and partial-failure tests. | Pass |
| AC3 | Adapter output is derived from proposal changes and their recorded reasons. | Adapter and CLI lifecycle tests. | Pass |
| AC4 | The adapter emits only approved proposal targets and has no default documentation-tree expansion. | Adapter tests and full repository audit. | Pass |
| AC5 | Existing files are supplied to the adapter for bounded semantic preservation. | LF, CRLF, BOM, and unrelated-content tests. | Pass |
| AC6 | The Codex adapter targets root instructions, Markdown, and `.agents/skills/<name>/SKILL.md`. | Adapter asset and lifecycle tests. | Pass |
| AC7 | The generated Project Architect skill is concise and routes to deterministic CLI behavior. | Canonical/package asset parity tests. | Pass |
| AC8 | No role-agent or prompt-library generation was added. | Diff review and full repository audit. | Pass |
| AC9 | Existing third-party provenance behavior is unchanged and the adapter copies only project-authored canonical skills. | Full regression suite. | Pass |
| AC10 | Rendered baselines, path containment, drift checks, and preflight protect existing files. | Conflict, drift, stale, and writer regression tests. | Pass |
| AC11 | Project ownership remains the default; managed ownership must be explicit. | First-managed and adoption tests. | Pass |
| AC12 | Receipts contain only version, path, adapter, baseline hash, and managed state. | Receipt schema and lifecycle tests. | Pass |
| AC13 | Fingerprints, stable ordering, and a compact exact retry digest make repeated application a no-op. | Deterministic render, symlink-metadata, Git-state, excluded-file, and already-applied tests. | Pass |
| AC14 | Read-only/root/rendering imports do not reach the writer; only the parsed apply branch loads application. | Import-boundary test. | Pass |
| AC15 | Every target and planned receipt receives a terminal result; failures retain exact changed paths and explicitly disclaim rollback. | Multi-conflict preflight, managed-receipt, and injected partial-write failure tests. | Pass |
| AC16 | Generation, merge, layout, stale approval, conflict, drift, idempotency, and failure safety are covered. | Full verification suite. | Pass |
| AC17 | Package exports separate rendering/application subpaths and isolate writer-capable imports. | Import-boundary test plus package export inspection. | Pass |
| AC18 | A versioned digest distinguishes exact already-applied state from partial application, Git/unrelated changes, uncertain captures, drift, and stale state without persistent history. | Rendering/application retry regressions. | Pass |
| AC19 | Existing BOM, dominant line endings, terminal newline, and unrelated content are retained. | Focused BOM/CRLF/LF/content tests. | Pass |
| AC20 | Build preparation copies canonical skills into package-local assets and runtime loading uses that path only. | Byte-parity and root-independent loader tests. | Pass |
| AC21 | `project.packageScripts` is required when applicable, strictly validated, and rendered through minimal creation or surgical strict-JSON updates. | Decision, question, adapter, and CLI lifecycle tests. | Pass |
| AC22 | Human render snapshots contain complete deterministic review material and human apply snapshots expose the same lifecycle facts and terminal outcomes as JSON. | CLI human/JSON lifecycle snapshots and core application result tests. | Pass |

Author verification results:

- `pnpm format:check`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed, 13 test files and 362 tests.
- `pnpm devcharter validate --format json`: passed with no errors or warnings.
- `pnpm devcharter audit --scope full --format json`: passed with zero findings and no repository writes.
- Fresh-install/package qualification was intentionally not run because it remains SPEC-0001E scope;
  SPEC-0001D establishes and tests the portable package-local asset path.
