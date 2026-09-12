# SPEC-0001E — Validation and Release Readiness

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0001E |
| Parent | SPEC-0001 |
| Status | done |
| Approval | The user approved the revised scope on 2026-09-09, completion amendments on 2026-09-11, and the final `active` to `done` transition on 2026-09-12 |

## Purpose

Prove that DevCharter can safely create, retrofit, audit, render, apply, and validate realistic
repositories through the installed CLI, and produce reproducible local release artifacts without
weakening the completed SPEC-0001A–D contracts.

## Accepted release decisions

- Preserve the existing `@devcharter/core`, `@devcharter/adapter-codex`, and `@devcharter/cli`
  package architecture.
- Qualify v0 through versioned local tarballs installed together without workspace links.
- Keep the workspace root private. Registry publication, namespace reservation, publishing
  automation, package bundling, and the legal license choice are external release-administration
  decisions, not technical qualification failures.
- Support Node.js 22 or later, subject to qualification, with exactly four CI jobs: Ubuntu/22,
  Ubuntu/24, Windows/24, and macOS/24.
- Expand `devcharter validate` by composing existing deterministic configuration and Project
  Architect analysis. It remains offline, read-only, and unable to execute arbitrary commands.
- Add `--decisions <file>` to `new` and `retrofit`, plus `--previous-proposal <file>` only where the
  existing revision contract requires it. Do not add these options to audit.
- Accept either bare canonical lifecycle artifacts or exactly one valid successful nested artifact
  from the preceding JSON command envelope for `render --proposal` and `apply --plan`.
- Store release evidence in `docs/release/v0-qualification.md` and a sanitized pilot report in
  `docs/release/habit-compass-pilot.md`.
- Habit Compass writes require separate explicit approval after its read-only audit and proposal
  phase. This specification approval does not authorize them.

## Product and safety boundaries

Do not add modes, scopes, statuses, `check`, sessions, persisted conversations, arbitrary command
execution, adapters, publishing automation, telemetry, hosted services, or a general plugin/agent
framework.

Preserve completed SPEC-0001A–D behavior unless a failing release journey proves that a small
compatible correction is required. If the three-package topology cannot work when installed from
tarballs, stop and report the evidence before restructuring.

## Deterministic validation

`devcharter validate` combines the existing compact-configuration and legacy-YAML checks with the
existing Project Architect analyzers. It reports objective integrity failures for malformed
configuration, broken or unsafe local references, duplicate/conflicting specification authority,
contradictory instruction routing or precedence, invalid/conflicting skill provenance,
objectively absent or mismatched documented/configured verification commands, and applicable
managed-output integrity failures.

Deterministic non-blocking inconsistencies are warnings. Subjective recommendations and general
ecosystem improvements remain audit findings and cannot make validation fail. Validation performs
zero writes and executes no project commands.

The release harness may execute only a fixed allowlist of DevCharter's own verification commands by
argument array without shell interpolation, using bounded working directories, explicit timeouts,
controlled environment values, and recorded exits. It never executes commands discovered in a
fixture or external repository.

Version-1 skill provenance accepts DevCharter `{ path, source }` entries and installer-style entries
with nonblank `source` and `sourceType`, a syntactically valid `computedHash`, and an optional safe
relative `skillPath`. Each entry maps only to `.agents/skills/<identity>` and is validated
independently. Invalid, missing, colliding, escaping, or identity-mismatched entries remain
project-owned without invalidating unrelated entries. Installer hashes establish provenance metadata
only; DevCharter does not claim installed-file integrity without a reproducible upstream algorithm.

## Composable CLI lifecycle

The installed CLI must support:

```text
discover → understand → answer → propose → approve
→ render → approve → apply → verify
```

`--decisions` reads the existing canonical accepted-decision records. `--previous-proposal`, when
needed, reads an existing canonical proposal to continue its revision contract. Both inputs are
read-only and reject malformed, duplicate, conflicting, inapplicable, or stale data with structured
errors. No new decision schema or session model is introduced.

`render --proposal` continues accepting a bare canonical proposal and also accepts a successful
`new` or `retrofit` JSON envelope containing exactly one valid proposal. `apply --plan` similarly
accepts a bare rendered plan or a successful render envelope containing exactly one valid rendered
plan. Missing, unsuccessful, ambiguous, or structurally invalid envelopes are rejected. Existing
fingerprint and approval validation remains authoritative.

## Production packaging

All three packages receive explicit production file lists and correct runtime dependencies.
Production compilation is separated from test/type-check compilation with the minimum configuration
necessary. Production `dist` directories and tarballs exclude tests/specs, fixtures, snapshots,
TypeScript build information, source-only scripts, repository prompts, specification-pack content,
unrelated Markdown, and development configuration.

Qualification packs all three packages, inspects every tarball, installs them together in a fresh
temporary repository without workspace links, runs the installed `devcharter` binary, and proves
the adapter loads packaged skills after the original checkout is unavailable.

## Validation fixtures

Use small purpose-built fixtures or deterministic builders for:

1. empty or lightly initialized project;
2. existing well-configured project;
3. conflicting or duplicated instructions;
4. broken references and renamed commands;
5. nested `AGENTS.md` files;
6. project-authored and third-party skills with provenance;
7. AI-heavy repository with overlapping prompts, agents, and skills;
8. superseded specifications with unclear authority;
9. CI and local verification mismatch;
10. developer-AI configuration alongside deferred runtime/product AI;
11. existing user-owned files and manually changed managed files;
12. small monorepo.

Do not copy Habit Compass or another maintained application into the test suite.

## Required end-to-end journeys

1. New, full scope.
2. New, AI-only with minimum output.
3. Retrofit, full scope, preserving useful content.
4. Retrofit, AI-only, consolidating only justified overlap.
5. Hostile read-only audit with complete stable no-write evidence.
6. Specification creation, approval, implementation, documentation update, and independent review.
7. Repeated unchanged application producing an exact no-op.

Attach final-state assertions proving there is no `check`, session/interview state, unjustified
agent/skill/prompt/hook/MCP/CI/infrastructure output, silent overwrite, unsupported rollback claim,
telemetry, network dependency, secret capture, path escape, or arbitrary command execution.

Audit snapshots compare only stable evidence: canonical path identity, entry type, symlink target
when readable without following it, size, safe content hash, Git HEAD/index/status, and applicable
exclusion metadata. Volatile access and modification timestamps are not evidence.

## Specification lifecycle evidence

Automated evidence covers specification templates, routing, allowed status transitions, approval
requirements, documentation synchronization, and completion-evidence invariants. It must not claim
that a unit test independently reviewed an implementation.

A separate fresh Codex task/context that did not implement the change must perform the manual
completion review. Record the reviewed revision, findings, corrections, final revision, and evidence.
A mocked model response or the implementation process reviewing itself is insufficient.

## Cross-platform CI

Add one minimal GitHub Actions workflow for pull requests and relevant pushes with four jobs only:

- Ubuntu, Node 22;
- Ubuntu, Node 24;
- Windows, Node 24;
- macOS, Node 24.

Use the lockfile and frozen installation. Run formatting, linting, type checking, production build,
tests, package inspection, fresh-tarball installation, release E2E, deterministic validation,
audit-no-write verification, and `git diff --check`. Grant read-only repository permissions and use
no publishing credentials or secrets. A genuinely unavailable OS safety capability is an explicit
qualified skip with the closest safe boundary case, never a silent pass.

## Habit Compass pilot

The first phase is read-only: audit Habit Compass, prepare a retrofit proposal, record expected
changes, and stop for separate explicit approval. The separately approved disposition uses a
dedicated non-protected pilot branch and never the default branch; an approved no-op requires no
render, apply, modification, or empty commit.

The sanitized report contains exact starting/resulting Git revisions, repository-relative paths,
finding/evidence categories, proposal summary, preserved components, approved changes, usability
observations, limitations, and deferrals. It contains no secrets, personal data, environment
contents, absolute local paths, or substantial copied source.

## Release documentation

Create or update only:

- README installation and complete lifecycle instructions;
- `CHANGELOG.md`;
- `docs/release/v0-qualification.md`;
- `docs/release/habit-compass-pilot.md`.

The qualification document records the release procedure, acceptance mapping, actual commands and
results, environments, tarball contents, qualified skips, known limitations, and deferrals.

## Acceptance criteria

1. All required unit, integration, fixture, E2E, packaging, platform, safety, and manual validation
   layers exist and map to applicable parent criteria.
2. Every mode and scope has representative coverage without a combinatorial matrix.
3. The installed CLI completes all seven required journeys, using installed-package execution where
   applicable.
4. Final-state negative assertions prove unnecessary or prohibited artifacts and behavior are absent.
5. Audit produces no repository writes or state and has stable filesystem/Git boundary evidence.
6. New and retrofit accept canonical decision files, remain proposal-gated, and reject malformed,
   duplicate, conflicting, inapplicable, or stale decision/proposal inputs.
7. Bare artifacts and successful JSON envelopes compose across new/retrofit → render → apply while
   invalid, unsuccessful, missing, or ambiguous envelopes are rejected.
8. Repeated unchanged application is an exact verified no-op.
9. Existing user files, useful content, and third-party provenance are preserved.
10. Conflict, drift, broken reference, command/CI mismatch, failing validation, and unavailable
    fixed release-command behavior are covered.
11. Security, privacy, offline operation, no telemetry, no secret copying, path containment, and no
    arbitrary command execution are proven.
12. All three production tarballs contain only intended runtime material, install without workspace
    links, expose the CLI, and load Codex assets without repository-root access.
13. Node.js 22+ qualification passes on the four-job CI matrix, with accurate explicit skips.
14. Codex output uses current official `AGENTS.md` and `.agents/skills` layout in a fresh repository.
15. Automated specification invariants and a genuine independent manual Codex journey provide
    separate, accurately described lifecycle evidence.
16. The read-only Habit Compass phase records its audit and proposal without modifying the external
    repository, and the separately approved disposition records exact revisions and outcomes.
17. README, changelog, qualification, pilot, current architecture, manifest routing, and this
    specification remain synchronized.
18. Release evidence records actual commands, results, environments, tarball contents, skips,
    limitations, and deferred work without claiming unperformed evidence.

## Completion gate

Do not move this specification to `done` or claim release readiness until every acceptance criterion
has traceable evidence, all supported CI jobs pass, installed tarballs work without the workspace,
the real CLI lifecycle passes both approval gates, audit no-write behavior is proven, the manual
specification journey has independent-review evidence, the separately approved Habit Compass pilot
is complete, and all failures, skips, and limitations are recorded accurately.

## Completion evidence

- Final pre-approval candidate `6f23df670a77131d8332ea7bd9e4d37f03bc0ead` passed all four
  supported CI jobs in run `34629735748`, including fresh-tarball qualification.
- Local formatting, linting, type checking, production build, 415 tests, 25 release tests,
  deterministic validation, full audit, and whitespace validation passed. Local Node 20 evidence is
  developmental; Node 22/24 qualification comes from CI.
- All three versioned tarballs passed content allowlists and fresh installation without workspace
  links. Applicable journeys 1 through 5 and 7 ran through the installed CLI; journey 6 remained the
  repository-level specification lifecycle invariant.
- A genuinely fresh Codex task independently reviewed candidate
  `fc713c5f07ed0bc4517d77a35679205606ef9596` after its four-job CI run passed. Its final verdict was
  `PASS` with no blocking, important, or advisory findings, and it made no files changes.
- The Habit Compass pilot recorded the approved unchanged preservation outcome at identical starting
  and resulting revision `e3424c23488929be8902aa089b2575ba8397792b`. All six proposed updates were
  rejected with path-level reasons, and no external write or empty commit occurred.
- `docs/release/v0-qualification.md` contains the acceptance mapping, commands, CI links, review
  corrections, package evidence, limitations, and external release-administration deferrals.
- The user explicitly approved the `active` to `done` transition on 2026-09-12.
