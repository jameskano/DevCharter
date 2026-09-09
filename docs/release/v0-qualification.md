# DevCharter v0 qualification

## Current status

SPEC-0001E is active. The implementation, built-CLI journeys, deterministic validation, production
build, and tarball inspection are locally exercised, but release readiness is not claimed. Supported
Node CI, the full fresh-install qualification, an independent specification completion review, and
the separately approved Habit Compass write phase remain completion gates.

## Release procedure

1. Install the frozen workspace lockfile with Node.js 22 or 24 and pnpm 10.18.3.
2. Run formatting, linting, type checking, the production build, and unit/integration tests.
3. Run the twelve deterministic fixtures and seven release journeys.
4. Pack `@devcharter/core`, `@devcharter/adapter-codex`, and `@devcharter/cli` as local versioned
   tarballs.
5. Reject tarballs containing anything outside their manifest and production `dist` tree, or any
   tests, fixtures, snapshots, build information, repository prompts, specifications, source-only
   scripts, unrelated documentation, or development configuration.
6. Install all three tarballs in a fresh temporary project with local-file overrides and no
   workspace links.
7. Run the installed binary, load the packaged Codex Project Architect skill, complete both approval
   gates, apply, validate, and repeat apply as an exact no-op.
8. Run DevCharter validation against this repository and verify hostile audit no-write evidence.
9. Require all four GitHub Actions jobs and the external/manual gates below before recommending
   `done`.

The qualification harness uses fixed argument arrays, bounded temporary directories, controlled
environment values, and timeouts. It never executes a command discovered from a fixture or external
repository.

## Local evidence on 2026-09-09

Environment: Windows, Node.js 20.19.0, pnpm 10.18.3. Node 20 is outside the supported range; these
results are development evidence only and do not qualify the Node 22+ runtime contract.

| Command                    | Result          | Evidence                                                                                                                                                                               |
| -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`        | pass            | All tracked and added files use the configured Prettier style.                                                                                                                         |
| `pnpm lint`                | pass            | ESLint passed.                                                                                                                                                                         |
| `pnpm typecheck`           | pass            | All package TypeScript projects passed.                                                                                                                                                |
| Frozen offline install     | pass            | The workspace lockfile was current and the existing dependency store satisfied `pnpm install --frozen-lockfile --offline`.                                                             |
| `pnpm build`               | pass            | Production output was rebuilt from clean package `dist` directories.                                                                                                                   |
| `pnpm test`                | pass            | 401 tests passed across 15 files, including unit, integration, fixture, built-CLI, audit, and release journeys.                                                                        |
| Release Vitest project     | pass            | 21 tests passed: 12 fixture analyses plus the catalog invariant and 8 journey/safety tests.                                                                                            |
| `git diff --check`         | pass            | No whitespace errors; Git reported only expected local line-ending notices.                                                                                                            |
| Self-validation            | pass            | Configuration, legacy configuration, repository integrity, and managed-output integrity all passed with zero writes after the documented pnpm global-option correction.                |
| Package inspection phase   | pass            | Three tarballs were created; file allowlists, private flags, and packed workspace dependency checks passed before installation.                                                        |
| Fresh tarball installation | blocked locally | Registry metadata requests for `yaml`, `zod`, and `jsonc-parser` failed with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`; the bounded install then timed out. TLS verification was not disabled. |
| Supported CI matrix        | pending         | The workflow exists; no remote jobs have run from this uncommitted revision.                                                                                                           |

The current production output contains 36 core runtime/type files, 4 adapter runtime/type/skill-asset
files, and 8 CLI runtime/type files. It contains no test files, test helper export, fixture, snapshot,
source map, TypeScript build-info file, repository prompt, specification pack, or development config.
Packed manifests retain the three-package runtime relationships but contain no `workspace:` protocol
after packing.

## Stable audit evidence

The hostile audit journey compares canonical repository-relative path identity, entry type, readable
symlink target without traversal, size, and content hash. It separately compares Git HEAD, index
hash, and porcelain-v2 status, and asserts the audit's exclusion metadata for a secret-like file.
Modification and access timestamps are excluded. The fixture includes an inert hostile package
script and asserts that its marker is never created. If Windows symlink creation is unavailable, the
test records a qualified capability skip and still exercises an unsafe parent-reference boundary.

## Acceptance-criterion mapping

| AC  | Current evidence                                                                                                                                              | State       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Unit/integration suites, fixture catalog, release journeys, packaging harness, CI workflow, safety assertions, and manual gates are separated.                | partial     |
| 2   | Existing package tests cover every mode and scope; release journeys cover representative full and AI paths without a Cartesian matrix.                        | implemented |
| 3   | Seven built-CLI journeys pass; the package harness contains a complete installed-CLI lifecycle but its local fresh install is certificate-blocked.            | partial     |
| 4   | Final-state and static negative assertions cover prohibited artifacts and behavior.                                                                           | implemented |
| 5   | Hostile audit stable filesystem/Git comparison passes with zero writes.                                                                                       | implemented |
| 6   | Decision/previous-proposal CLI inputs and malformed, duplicate, conflicting/inapplicable, audit, and stale rejection tests pass.                              | implemented |
| 7   | Bare and successful-envelope composition plus invalid-envelope tests pass.                                                                                    | implemented |
| 8   | The second unchanged apply returns `already-applied`, no changed paths, no failures, and an identical stable snapshot.                                        | implemented |
| 9   | Retrofit and provenance fixtures verify useful/user/third-party preservation; managed drift is rejected.                                                      | implemented |
| 10  | Conflict, drift, reference, command/CI mismatch, validation failure, and unavailable local install evidence exist.                                            | implemented |
| 11  | Offline core behavior, no telemetry/secret copying, containment, audit no-write, and no command execution are tested; supported-platform evidence is pending. | partial     |
| 12  | Production/tar inspection passes; fresh installed execution and asset loading are implemented in the harness but not locally completed.                       | partial     |
| 13  | Exactly four supported CI jobs are configured. Results are pending.                                                                                           | pending     |
| 14  | The Codex adapter packages current root `AGENTS.md` and `.agents/skills` assets; fresh-install proof is pending.                                              | partial     |
| 15  | Automated specification invariants pass. A genuine independent fresh-context completion review is pending.                                                    | partial     |
| 16  | The Habit Compass audit/proposal phase completed at an unchanged revision and dirty status; separate write approval and the write phase remain pending.       | partial     |
| 17  | README, changelog, qualification, pilot, architecture, manifest, and active specification are synchronized for the current implementation phase.              | implemented |
| 18  | This document records actual commands, environment, contents, skip/blocker, limitations, and deferrals without claiming missing evidence.                     | implemented |

## Known limitations and deferrals

- This workstation cannot qualify Node.js 22+ because its active runtime is Node 20.19.0.
- Fresh dependency metadata access is blocked by the workstation certificate chain. The harness does
  not weaken TLS to turn that failure into a pass.
- GitHub Actions results do not exist until the revision is pushed.
- The automated specification tests do not constitute independent review. A new Codex task that did
  not implement the change must record reviewed revision, findings, corrections, final revision, and
  evidence.
- Habit Compass writes require separate explicit approval after its read-only audit/proposal report.
- Registry publication, namespace reservation, publishing credentials/automation, and legal license
  selection are outside technical qualification.
