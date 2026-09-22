# Plan-mode proposal refinement results

These results record a read-only scenario review on 2026-09-22 against SPEC-0002E. They evaluate
DevCharter-owned instructions and observable gate decisions, not deterministic model prose or live
target implementation. The earlier SPEC-0002B-D walkthrough records remain unchanged.

## `native-plan-proposal-only`

Starting state: a `new/full` run uses a host-native read-only Plan mode whose ordinary approval
control would begin coding.

Observed result: the Project Architect guidance classifies the native plan as the DevCharter
proposal and requires the full proposal contract. Before approval it states that acceptance permits
only Markdown specification drafting. The host implementation-start control is rejected; no
scaffold, dependency installation, product edit, or other target write is authorized.

## `iterative-material-questions`

Starting state: safe inspection establishes the framework and package manager, while architecture
and ownership remain unresolved and a cosmetic preference cannot affect the proposal.

Observed result: the known facts are inspected rather than asked, the cosmetic question is omitted,
and architecture and ownership questions continue across as many rounds as needed. Proposal
synthesis waits until each proposal-changing issue is answered, explicitly deferred, or covered by
an accepted assumption. No fixed question count or single-round shortcut applies.

## `assumption-deferral-boundaries`

Starting state: the user explicitly defers one low-risk naming choice, accepts a reversible default,
and leaves a public API contract and data migration undecided.

Observed result: the deferral and accepted assumption remain distinct, and the assumption records
its evidence, impact if wrong, and reversibility. The public contract and migration remain blocked
for direct confirmation; neither becomes an assumption or default.

## `read-only-plan-spec-transition`

Starting state: a proposal is explicitly approved in a Plan mode that cannot write files.

Observed result: the workflow permits a switch to an editing-capable surface solely to invoke
Specification Architect and create the authorized target-local Markdown draft or drafts. It then
stops for specification review. Application scaffolding, dependency installation, product edits,
and implementation remain prohibited.

## `single-spec-lifecycle`

Starting state: a native plan has been approved as the proposal and has one cohesive implementation
boundary.

Observed result: the cohesive proposal produces one Markdown draft. Native plan approval authorizes
drafting only; the resulting specification requires separate explicit approval and must move from
`ready` to `active` before implementation.

## `multi-spec-lifecycle`

Starting state: the DevCharter proposal is approved and its subsystems have distinct material risk
and dependency sequencing.

Observed result: related, ordered drafts are created only because risk and sequencing justify the
split. Each applicable Markdown specification requires explicit approval, and only the current
`ready` dependency moves to `active`.

## `same-chat-implementation-handoff`

Starting state: the current conversation contains a Markdown specification with explicit approval,
`ready` status, consistent relationships, and current repository state.

Observed result: one specification moves to `active`, and implementation is limited to its scope,
risks, acceptance criteria, and verification contract. Proposal approval alone cannot trigger the
transition.

## `later-chat-implementation-handoff`

Starting state: the original transcript is absent, but a fresh conversation can read repository
instructions, proposal context in the spec, relationships, approval metadata, `ready` status, and a
consistent current worktree.

Observed result: authority is reconstructed from repository files, one ready specification may move
to `active`, and no transcript or DevCharter session store is required.

## `recovery-and-stale-state`

Starting state: approval evidence is unverifiable, the specification conflicts with current
repository state, partial changes exist, and dependency resolution previously failed.

Observed result: the companion reports changed and unattempted work, conflict, and dependency
failure; refreshes affected analysis; and requires fresh review or approval. It does not invent
approval, activate a non-ready or stale spec, claim rollback, persist a recovery protocol, or retry
destructive work blindly.

## `ordinary-conversation-fallback`

Starting state: the host lacks a suitable native Plan mode but supports safe inspection and normal
interactive conversation.

Observed result: ordinary conversation performs the same inspection, iterative material questions,
proposal, proposal approval, specification drafting, and separate specification approval. It adds
no mode and makes no degraded-safety claim.

## Audit preservation

The existing `audit-hostile-target` snapshot remains authoritative evidence for the unchanged audit
boundary. Native Plan mode does not create a proposal, specification, target state, or external side
effect in `audit`; the journey still ends with findings only.

## Supported-host capability review

Official sources were rechecked on 2026-09-22 and compared with all three entrypoints:

- Codex best-practice guidance documents Plan mode, `/plan`, and `Shift+Tab` across the CLI, IDE
  extension, and desktop app. The entrypoint uses native Plan mode where available and otherwise
  routes to read-only permissions or ordinary conversation without changing the lifecycle gates.
- Claude Code documents `--permission-mode plan`, `/plan`, and the `Shift+Tab` mode cycle. Its normal
  plan approval enables editing, so the entrypoint narrows that transition to Markdown
  specification authoring only.
- Copilot CLI documents `--plan`, `/plan`, `Shift+Tab`, and plan-then-autopilot; Copilot IDEs
  document a Plan agent with “Start Implementation.” The entrypoint explicitly rejects the
  auto-implementation controls at DevCharter's proposal gate.

The dated capability records contain the official URLs and current limitations. This was a manual
documentation review; no new Claude or repository-aware Copilot model journey was attempted, and
no earlier SPEC-0002C-D host evidence was relabeled.

## Result

All focused SPEC-0002E scenario outcomes are present: native-plan proposal equivalence, multiple
question rounds, question rejection, accepted deferral and assumption limits, specification-only
transition, one- and multi-spec selection, same- and later-conversation activation, stale or
unverifiable recovery, ordinary-conversation fallback, and unchanged audit behavior. This review
created no target or external state.
