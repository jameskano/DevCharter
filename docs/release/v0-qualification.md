# DevCharter v0 qualification

## Current status

SPEC-0001E is done following explicit human approval on 2026-09-12. The implementation, built-CLI
journeys, deterministic validation, production build, tarball inspection, supported Node matrix,
fresh-install qualification, and corrected read-only Habit Compass preservation pilot are complete.
The initial independent completion review found one blocking and three important issues; all four
were corrected, and the independent re-review passed with no findings.

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
7. Run every applicable release journey through the installed binary, load the packaged Codex
   Project Architect skill, complete both approval gates, apply, validate, and repeat apply as an
   exact no-op. Keep the repository-lifecycle invariant as journey 6 because it has no CLI action.
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

| Command                    | Result          | Evidence                                                                                                                                                                                       |
| -------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`        | pass            | All tracked and added files use the configured Prettier style.                                                                                                                                 |
| `pnpm lint`                | pass            | ESLint passed.                                                                                                                                                                                 |
| `pnpm typecheck`           | pass            | All package TypeScript projects passed.                                                                                                                                                        |
| Frozen offline install     | pass            | The workspace lockfile was current and the existing dependency store satisfied `pnpm install --frozen-lockfile --offline`.                                                                     |
| `pnpm build`               | pass            | Production output was rebuilt from clean package `dist` directories.                                                                                                                           |
| `pnpm test`                | pass            | 415 tests passed across 16 files, including unit, integration, fixture, built-CLI, audit, fixed-process, generated-state classification, and release journeys.                                 |
| `pnpm test:release`        | pass            | 25 tests passed: 12 fixture analyses, the catalog invariant, 8 journey/safety tests, and 4 fixed release-command tests.                                                                        |
| `pnpm test:audit-no-write` | pass            | The hostile audit passed; the 24 unrelated release tests were explicitly skipped by the name filter.                                                                                           |
| `git diff --check`         | pass            | No whitespace errors; Git reported only expected local line-ending notices.                                                                                                                    |
| Self-validation            | pass            | Configuration, legacy configuration, repository integrity, and managed-output integrity all passed with zero failures, warnings, skips, or writes.                                             |
| Package inspection phase   | pass            | Three tarballs were created; file allowlists, private flags, and packed workspace dependency checks passed before installation.                                                                |
| Fresh tarball installation | blocked locally | Registry metadata for `jsonc-parser` failed with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` after bounded retries. TLS verification was not disabled.                                                   |
| Supported CI matrix        | pass            | Final pre-approval candidate `6f23df670a77131d8332ea7bd9e4d37f03bc0ead` passed all four jobs in run `34629735748`, including installed-CLI qualification for every applicable release journey. |

The current production output contains 36 core runtime/type files, 4 adapter runtime/type/skill-asset
files, and 8 CLI runtime/type files. It contains no test files, test helper export, fixture, snapshot,
source map, TypeScript build-info file, repository prompt, specification pack, or development config.
Packed manifests retain the three-package runtime relationships but contain no `workspace:` protocol
after packing.

## Supported CI and installed-package evidence

GitHub Actions run [`34629735748`](https://github.com/jameskano/DevCharter/actions/runs/34629735748)
qualified final pre-approval candidate `6f23df670a77131d8332ea7bd9e4d37f03bc0ead`:

- [Ubuntu / Node 22](https://github.com/jameskano/DevCharter/actions/runs/34629735748/job/103363348586): pass;
- [Ubuntu / Node 24](https://github.com/jameskano/DevCharter/actions/runs/34629735748/job/103363348316): pass;
- [Windows / Node 24](https://github.com/jameskano/DevCharter/actions/runs/34629735748/job/103363348629): pass;
- [macOS / Node 24](https://github.com/jameskano/DevCharter/actions/runs/34629735748/job/103363348512): pass.

Each job completed frozen installation, formatting, linting, type checking, production build, 415
tests, 25 release tests, package qualification, deterministic repository validation, hostile audit
no-write verification, and the Git diff whitespace check. The successful package report recorded:

- three versioned tarballs with only their manifests and production `dist` material;
- installed CLI version `0.1.0`;
- installed-CLI release journeys 1, 2, 3, 4, 5, and 7, with the repository-lifecycle invariant
  retained as journey 6;
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

| AC  | Current evidence                                                                                                                                                                                                               | State       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| 1   | Unit/integration suites, fixture catalog, release journeys, packaging harness, CI workflow, safety assertions, and independent manual review are separated and complete.                                                       | implemented |
| 2   | Existing package tests cover every mode and scope; release journeys cover representative full and AI paths without a Cartesian matrix.                                                                                         | implemented |
| 3   | Seven workspace journeys pass; applicable journeys 1, 2, 3, 4, 5, and 7 also pass through the fresh-installed tarball CLI on every supported CI platform, while journey 6 remains a repository invariant.                      | implemented |
| 4   | Final-state and static negative assertions cover prohibited artifacts and behavior.                                                                                                                                            | implemented |
| 5   | Hostile audit stable filesystem/Git comparison passes with zero writes.                                                                                                                                                        | implemented |
| 6   | Decision/previous-proposal CLI inputs and malformed, duplicate, conflicting/inapplicable, audit, and stale rejection tests pass.                                                                                               | implemented |
| 7   | Bare and successful-envelope composition plus invalid-envelope tests pass.                                                                                                                                                     | implemented |
| 8   | The second unchanged apply returns `already-applied`, no changed paths, no failures, and an identical stable snapshot.                                                                                                         | implemented |
| 9   | Retrofit and provenance fixtures verify useful/user/third-party preservation, including both supported version-1 lock shapes and conservative per-entry failure; managed drift is rejected.                                    | implemented |
| 10  | Conflict, drift, reference, command/CI mismatch, validation failure, and unavailable/nonzero/timed-out fixed release-command behavior are covered.                                                                             | implemented |
| 11  | Offline core behavior, no telemetry/secret copying, containment, audit no-write, no arbitrary command execution, and supported-platform behavior pass automated qualification.                                                 | implemented |
| 12  | All three tarballs pass allowlists and fresh installation; the installed adapter resolves inside the bounded installation, loads both packaged skills, and cannot read the source-checkout sentinel.                           | implemented |
| 13  | Exactly four supported CI jobs are configured and all pass on final pre-approval candidate `6f23df670a77131d8332ea7bd9e4d37f03bc0ead`.                                                                                         | implemented |
| 14  | The Codex adapter packages and loads the current `AGENTS.md` and `.agents/skills` assets from a fresh installation without source-checkout access.                                                                             | implemented |
| 15  | Automated specification invariants pass, and a genuine fresh-context task completed a read-only independent review with no findings.                                                                                           | implemented |
| 16  | The corrected audit/proposal ran in the authorized clean isolated branch; all six updates were explicitly rejected with path-level reasons, and the approved preservation outcome records identical revisions and zero writes. | implemented |
| 17  | README, changelog, qualification, pilot, architecture, manifest, and completed specification are synchronized.                                                                                                                 | implemented |
| 18  | This document records actual commands, environment, contents, skip/blocker, limitations, and deferrals without claiming missing evidence.                                                                                      | implemented |

## Independent completion review

A genuinely fresh Codex task that did not implement SPEC-0001E reviewed revision
`b3b382727fee92a8331c6ddb90b740d115745796` with
`prompts/codex/03-review-completion.md`. It kept the worktree unchanged and returned `FAIL` with:

- one blocking finding: applicable journeys 1, 3, 4, and 5 were proven only with the workspace
  build, not the fresh-installed tarball CLI;
- one implementation-important finding: `.typecheck` directories and `*.tsbuildinfo` files were
  treated as project-owned fingerprint inputs instead of generated build state;
- two evidence-important findings: the qualification record did not name the reviewed candidate and
  CI run, and the changelog still described a pending Habit Compass write phase.

Revision `562be42876a1cbc0d8f9be32386f726375b337d6` resolved all four findings without changing the
public command surface: the package harness reuses the release journeys with the installed CLI,
generated TypeScript state is excluded with a fingerprint-stability regression, and the changelog
records the approved no-write pilot. Run `34621930415` proves the implementation corrections on all
four supported jobs.

The same independent task then re-reviewed exact revision
`fc713c5f07ed0bc4517d77a35679205606ef9596` after its four jobs passed in run
[`34622276731`](https://github.com/jameskano/DevCharter/actions/runs/34622276731). It ran the required
local checks, independently verified both CI runs, mapped every acceptance criterion, and left HEAD,
the index, and the worktree unchanged. Its final verdict was `PASS`, with no blocking, important, or
advisory findings. All 18 acceptance criteria passed. This review is the independent manual gate;
the implementing task did not review itself.

## Known limitations and deferrals

- This workstation cannot qualify Node.js 22+ because its active runtime is Node 20.19.0.
- Fresh dependency metadata access is blocked by the workstation certificate chain. The harness does
  not weaken TLS to turn that failure into a pass.
- The passing independent review applies to revision
  `fc713c5f07ed0bc4517d77a35679205606ef9596`; the final pre-approval evidence revision
  `6f23df670a77131d8332ea7bd9e4d37f03bc0ead` passed all four jobs in run `34629735748`.
- Habit Compass's six-update proposal was rejected after path-level review. The approved preservation
  outcome contains no render, apply, repository modification, commit, push, merge, lockfile rewrite,
  or default-branch change.
- Registry publication, namespace reservation, publishing credentials/automation, and legal license
  selection are outside technical qualification.
