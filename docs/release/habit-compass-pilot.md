# Habit Compass pilot

## Authorization boundary

The initial SPEC-0001E approval authorized only a read-only audit and retrofit proposal. The later
2026-09-11 amendment authorized the isolated local pilot branch described below, but no presently
unknown Habit Compass write. DevCharter must stop for separate explicit approval after presenting
any concrete proposal.

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

On 2026-09-11, the user authorized an isolated local worktree and non-protected
`devcharter/pilot-v0` branch from clean `main` revision
`e3424c23488929be8902aa089b2575ba8397792b`. The authorization permitted a genuine no-op after the
corrected provenance analysis, but no presently unknown file modification, push, merge, default
branch change, or edit to make `skills-lock.json` fit DevCharter.

The corrected CLI completed a second read-only audit and retrofit run on that isolated branch:

- Starting and resulting revision: `e3424c23488929be8902aa089b2575ba8397792b`.
- Starting and resulting tree: `a13e4c45faf44c177c32f0b51ecde01b0e0ac352`.
- Git status: unchanged and clean.
- Repository fingerprint: `4e499cb7624835a95802464938dae9f00d6e1130dea3b948532ee35fd740359e`.
- Audit: success with 10 findings, reduced from 20 after valid installer provenance was recognized.
- Retrofit: successful unapproved proposal revision 1 with fingerprint
  `4cc1fcd708ca5de333b16c164a60ec7d5544a6de31ba014ba73088816025500c`, zero questions,
  zero creates, six updates, three skips, and zero conflicts.

The remaining proposed update targets are:

- `.agents/skills/caveman/README.md` for a reported `../../README.md` reference;
- `.agents/skills/shadcn/SKILL.md` and `.agents/skills/shadcn/cli.md` for reported shadcn CLI
  command-authority gaps;
- `.agents/skills/vercel-react-best-practices/AGENTS.md` and
  `.agents/skills/vercel-react-best-practices/README.md` for reported references and commands;
- `skills-lock.json` because the locked `ui-skills-root` identity has no matching local skill
  directory.

Because the corrected proposal still contains actual modifications, the pilot stopped before render
or apply as required. No content or diff exists at the abstract proposal stage, no approval artifact
was created, and no Habit Compass file was modified. The six exact targets and proposal fingerprints
must receive separate human review before any further pilot action; third-party documentation and
the external installer lock must not be rewritten merely to satisfy DevCharter.

Manual inspection found no proposal action suitable for DevCharter application:

- the caveman reference is broken after installation, but the generic Markdown renderer cannot
  produce the specific link repair and should not rewrite imported skill documentation;
- the shadcn findings interpret portable package-runner examples as Habit Compass commands;
- the Vercel AGENTS findings combine generated relative-link issues with an example application path,
  while its README findings describe upstream skill-maintenance commands rather than Habit Compass
  commands;
- the `ui-skills-root` entry is valid installer metadata for a directory that is not installed, and
  rewriting it merely to silence DevCharter is explicitly outside authorization.

The recommended pilot disposition is therefore to reject all six updates and record the identical
starting/resulting revision as a preservation outcome. This recommendation is not yet an approval or
a completed no-op; explicit human acceptance remains required.
