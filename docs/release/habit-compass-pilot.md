# Habit Compass pilot

## Authorization boundary

SPEC-0001E authorizes only a read-only audit and retrofit proposal in the first phase. It does not
authorize a branch or any Habit Compass write. After this report records the read-only evidence and
expected changes, DevCharter must stop for separate explicit approval.

## Read-only phase

Completed on 2026-09-09 with the built DevCharter CLI in full scope.

- Starting revision: `e3424c23488929be8902aa089b2575ba8397792b`.
- Resulting revision: `e3424c23488929be8902aa089b2575ba8397792b`.
- Branch observed: `fix/account-deletion-and-authentication`.
- Starting and resulting worktree state: identical, with 23 pre-existing tracked modifications and
  8 pre-existing untracked files in the current authentication/account-deletion workstream.
- DevCharter repository fingerprint: `f6b7f5f60eb57e0fc788a92f9e73fa85355bed607345cbfb67f7330213b0c606`.
- Audit result: success, 1,350 inventoried artifacts, 20 findings, zero applied changes.
- Retrofit result: successful unapproved proposal revision 1, no unresolved questions, 1,143
  included fingerprint inputs, 1,346 preserved project paths, and zero writes.

### Findings and evidence categories

The audit reported 20 objective findings:

- Nine broken-reference findings in copied or locally maintained skill documentation under
  `.agents/skills/`.
- Ten documented-command findings in skill reference material. Several appear to be parser false
  positives from natural-language words or package-install examples rather than Habit Compass
  verification commands.
- One invalid skill-provenance finding at `skills-lock.json`. Because provenance was not accepted,
  the affected skill material remained conservatively classified as project-authored.

Secret-like environment files, dependencies, generated build output, binary assets, Android build
artifacts, temporary logs, and unrelated migration material were explicitly excluded by category.
No excluded content was copied into this report.

### Proposal summary and expected changes

The raw proposal contains 18 target decisions:

- Preserve without change: `AGENTS.md`, `README.md`, and `package.json`.
- Consider 14 documentation repairs under `.agents/skills/` for detected references or commands.
- Consider one provenance repair in `skills-lock.json`.

The proposal should not be applied as-is. Before any write approval, each skill must be classified as
project-authored or third-party and the ten command findings must be narrowed to genuine repository
commands. The smallest credible pilot would repair the provenance authority first, retain the three
adequate root authorities, then regenerate the proposal so third-party material is not rewritten.

### Preserved existing components

The proposal preserves the existing concise root instruction contract, product README, pnpm
verification authority, specification system, current CI, engineering documentation, tests, source,
and the pre-existing authentication/account-deletion worktree changes. It proposes no new agents,
skills, prompts, hooks, MCP integration, CI, infrastructure, runtime AI, or product scope.

### Usability observations

- Read-only behavior held: both Git revision and dirty worktree state were unchanged after audit and
  retrofit analysis.
- The proposal correctly recognized the root instructions, README, and package manifest as adequate.
- Full JSON output for a repository with large vendored skill trees is unwieldy; the audit produced a
  very large artifact/preservation payload. A summary or filtering surface may be useful in a later
  approved specification.
- Invalid provenance makes copied skill examples look project-authored and amplifies reference and
  command noise. This is safe in that it blocks blind trust, but the resulting update proposal needs
  human narrowing before it is useful.
- Command parsing needs better discrimination between repository commands, package-install examples,
  and ordinary prose. This is recorded as a release limitation, not silently treated as approved
  Habit Compass work.

### Limitations and deferrals

- No project command, test, render, approval, apply, branch creation, or external write was performed.
- No recommendation is made about the pre-existing dirty authentication/account-deletion changes;
  they are outside the pilot scope and must remain untouched.
- The candidate provenance and parser corrections require a new proposal after explicit ownership
  decisions. They are not authorized by SPEC-0001E implementation approval.

## Approved changes and write phase

None. The next step requires separate explicit approval. If approved, writes must occur only on a
new dedicated non-protected pilot branch created from an explicitly selected clean base; the current
dirty feature branch and the default branch are not valid write targets.
