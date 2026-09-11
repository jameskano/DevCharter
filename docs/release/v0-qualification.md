# DevCharter v0 qualification

## Current status

SPEC-0001E is active. The implementation, built-CLI journeys, deterministic validation, production
build, tarball inspection, supported Node matrix, fresh-install qualification, and corrected
read-only Habit Compass rerun are exercised, but release readiness is not claimed. A genuine
independent specification completion review and separate approval of the concrete Habit Compass
pilot disposition remain completion gates.

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
environment values, and timeouts. Its fixed-command behavior is tested for unavailable executables,
nonzero exits, captured evidence, and timeouts. It never executes a command discovered from a
fixture or external repository.

## Local evidence on 2026-09-11

Environment: Windows, Node.js 20.19.0, pnpm 10.18.3. Node 20 is outside the supported range; these
results are development evidence only and do not qualify the Node 22+ runtime contract.

| Command                    | Result          | Evidence                                                                                                                                           |
| -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`        | pass            | All tracked and added files use the configured Prettier style.                                                                                     |
| `pnpm lint`                | pass            | ESLint passed.                                                                                                                                     |
| `pnpm typecheck`           | pass            | All package TypeScript projects passed.                                                                                                            |
| Frozen offline install     | pass            | The workspace lockfile was current and the existing dependency store satisfied `pnpm install --frozen-lockfile --offline`.                         |
| `pnpm build`               | pass            | Production output was rebuilt from clean package `dist` directories.                                                                               |
| `pnpm test`                | pass            | 414 tests passed across 16 files, including unit, integration, fixture, built-CLI, audit, fixed-process, and release journeys.                     |
| `pnpm test:release`        | pass            | 25 tests passed: 12 fixture analyses, the catalog invariant, 8 journey/safety tests, and 4 fixed release-command tests.                            |
| `pnpm test:audit-no-write` | pass            | The hostile audit passed; the 24 unrelated release tests were explicitly skipped by the name filter.                                               |
| `git diff --check`         | pass            | No whitespace errors; Git reported only expected local line-ending notices.                                                                        |
| Self-validation            | pass            | Configuration, legacy configuration, repository integrity, and managed-output integrity all passed with zero failures, warnings, skips, or writes. |
| Package inspection phase   | pass            | Three tarballs were created; file allowlists, private flags, and packed workspace dependency checks passed before installation.                    |
| Fresh tarball installation | blocked locally | Registry metadata for `jsonc-parser` failed with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` after bounded retries. TLS verification was not disabled.       |
| Supported CI matrix        | pass            | Candidate `714cb112aed0f796f43b008d969c808f70f186a1` passed all four jobs in run `34591566766`.                                                    |

The current production output contains 36 core runtime/type files, 4 adapter runtime/type/skill-asset
files, and 8 CLI runtime/type files. It contains no test files, test helper export, fixture, snapshot,
source map, TypeScript build-info file, repository prompt, specification pack, or development config.
Packed manifests retain the three-package runtime relationships but contain no `workspace:` protocol
after packing.

## Supported CI and installed-package evidence

GitHub Actions run [`34591566766`](https://github.com/jameskano/DevCharter/actions/runs/34591566766)
qualified candidate `714cb112aed0f796f43b008d969c808f70f186a1`:

- [Ubuntu / Node 22](https://github.com/jameskano/DevCharter/actions/runs/34591566766/job/103237803928): pass;
- [Ubuntu / Node 24](https://github.com/jameskano/DevCharter/actions/runs/34591566766/job/103237803977): pass;
- [Windows / Node 24](https://github.com/jameskano/DevCharter/actions/runs/34591566766/job/103237804014): pass;
- [macOS / Node 24](https://github.com/jameskano/DevCharter/actions/runs/34591566766/job/103237803878): pass.

Each job completed frozen installation, formatting, linting, type checking, production build, 414
tests, 25 release tests, package qualification, deterministic repository validation, hostile audit
no-write verification, and the Git diff whitespace check. The successful package report recorded:

- three versioned tarballs with only their manifests and production `dist` material;
- installed CLI version `0.1.0`;
- an installed `new`/AI lifecycle with two approval gates, `applied` outcome, passing validation,
  and an `already-applied` retry;
- packaged `project-architect` and `specification-architect` skills;
- denied access to the original source-checkout sentinel.

## Stable audit evidence

The hostile audit journey compares canonical repository-relative path identity, entry type, readable
symlink target without traversal, size, and content hash. It separately compares Git HEAD, index
hash, and porcelain-v2 status, and asserts the audit's exclusion metadata for a secret-like file.
Modification and access timestamps are excluded. The fixture includes an inert hostile package
script and asserts that its marker is never created. If Windows symlink creation is unavailable, the
test records a qualified capability skip and still exercises an unsafe parent-reference boundary.

## Acceptance-criterion mapping

| AC  | Current evidence                                                                                                                                                                                     | State       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Unit/integration suites, fixture catalog, release journeys, packaging harness, CI workflow, safety assertions, and manual gates are separated; the independent manual gate remains pending.          | partial     |
| 2   | Existing package tests cover every mode and scope; release journeys cover representative full and AI paths without a Cartesian matrix.                                                               | implemented |
| 3   | Seven built-CLI journeys pass, and the installed-tarball lifecycle passes both approval gates, apply, validate, and exact retry no-op on all supported CI platforms.                                 | implemented |
| 4   | Final-state and static negative assertions cover prohibited artifacts and behavior.                                                                                                                  | implemented |
| 5   | Hostile audit stable filesystem/Git comparison passes with zero writes.                                                                                                                              | implemented |
| 6   | Decision/previous-proposal CLI inputs and malformed, duplicate, conflicting/inapplicable, audit, and stale rejection tests pass.                                                                     | implemented |
| 7   | Bare and successful-envelope composition plus invalid-envelope tests pass.                                                                                                                           | implemented |
| 8   | The second unchanged apply returns `already-applied`, no changed paths, no failures, and an identical stable snapshot.                                                                               | implemented |
| 9   | Retrofit and provenance fixtures verify useful/user/third-party preservation, including both supported version-1 lock shapes and conservative per-entry failure; managed drift is rejected.          | implemented |
| 10  | Conflict, drift, reference, command/CI mismatch, validation failure, and unavailable/nonzero/timed-out fixed release-command behavior are covered.                                                   | implemented |
| 11  | Offline core behavior, no telemetry/secret copying, containment, audit no-write, no arbitrary command execution, and supported-platform behavior pass automated qualification.                       | implemented |
| 12  | All three tarballs pass allowlists and fresh installation; the installed adapter resolves inside the bounded installation, loads both packaged skills, and cannot read the source-checkout sentinel. | implemented |
| 13  | Exactly four supported CI jobs are configured and all pass on candidate `714cb112aed0f796f43b008d969c808f70f186a1`.                                                                                  | implemented |
| 14  | The Codex adapter packages and loads the current `AGENTS.md` and `.agents/skills` assets from a fresh installation without source-checkout access.                                                   | implemented |
| 15  | Automated specification invariants pass. A genuine independent fresh-context completion review is pending.                                                                                           | partial     |
| 16  | The corrected audit/proposal ran in the authorized clean isolated branch with identical starting/resulting revisions and no writes; its six concrete updates require separate approval.              | partial     |
| 17  | README, changelog, qualification, pilot, architecture, manifest, and active specification are synchronized for the current implementation phase.                                                     | implemented |
| 18  | This document records actual commands, environment, contents, skip/blocker, limitations, and deferrals without claiming missing evidence.                                                            | implemented |

## Known limitations and deferrals

- This workstation cannot qualify Node.js 22+ because its active runtime is Node 20.19.0.
- Fresh dependency metadata access is blocked by the workstation certificate chain. The harness does
  not weaken TLS to turn that failure into a pass.
- The automated specification tests do not constitute independent review. A new Codex task that did
  not implement the change must record reviewed revision, findings, corrections, final revision, and
  evidence.
- Habit Compass produced a real six-update proposal, so a no-op cannot be recorded. Its exact
  proposal requires separate explicit approval before render or apply.
- Registry publication, namespace reservation, publishing credentials/automation, and legal license
  selection are outside technical qualification.
