# Shared foundation

This file preserves the implementation-independent rules extracted from the superseded v0 runtime.
SPEC-0002B may refine and organize them, but must not reintroduce a product runtime.

## Discovery and authority

- Inspect before asking, proposing, or creating.
- Separate project-authored, DevCharter-created, third-party, generated/vendor, and unknown-origin
  material. Third-party content does not become project authority merely because it is local.
- Distinguish developer-AI configuration from runtime/product AI behavior and future ideas.
- Identify current documentation, historical specifications, command authority, instruction
  precedence, and conflicts. A file's existence does not make it authoritative.
- Treat unreadable, unsafe, secret-like, binary, oversized, or ambiguous material conservatively;
  record the limitation without copying sensitive content.

## Decisions and minimum sufficiency

- Separate confirmed facts, inferences, assumptions, accepted decisions, open questions, and
  rejected options.
- After safe inspection, ask every unresolved question whose answer could materially change
  behavior, architecture, scope, output, ownership, safety, verification, or user expectations.
  Use as many rounds as needed; do not ask for repository-answerable facts or immaterial
  preferences.
- Prefer an explicit decision to an avoidable assumption. Retain a proposal-changing assumption
  only after the user accepts it and only when it is low risk and reversible; record its evidence,
  impact if wrong, and reversibility.
- Generate an artifact only when evidence or an accepted decision justifies it. Prefer preserving
  an adequate project-owned file over replacing it.
- Give each relevant component one `create`, `update`, `preserve`, `skip`, `replace`, `reject`, or
  `conflict` decision and explain why.
- Record considered and rejected ecosystem components so omission is reviewable.

## Approval and safety

- `audit` is read-only: do not write, install dependencies, run mutating target commands, or create
  target-local state.
- `new` and `retrofit` produce a reviewable proposal before detailed planning.
- A suitable native Plan mode is an optional surface for discovery, questions, and proposal
  refinement. Its output occupies the proposal stage; ordinary conversation is the equivalent
  fallback and `audit` still ends with findings only.
- Proposal approval authorizes Markdown specification drafting, not implementation.
- Only explicit approval of the applicable Markdown implementation specification moves it to
  `ready` and authorizes its stated scope and acceptance criteria.
- Stop and renew approval when implementation discovers a material need outside the specification.
- Immediately confirm destructive actions, secret access, external data sharing, remote writes, and
  hard-to-reverse operations.
- Preserve unrelated changes, contain writes to approved target paths, and report partial results
  accurately. Never store credentials, complete conversations, or hidden reasoning.

## Verification

- Reuse authoritative repository commands when adequate; do not infer arbitrary shell behavior.
- Verify the narrowest relevant behavior first, then broaden according to blast radius.
- Exercise critical developer or user journeys when they are material; isolated checks alone do not
  prove a journey.
- Report commands, results, failures, timeouts, skips, limitations, and documentation review
  accurately.

## Detailed guidance

- [Ecosystem component selection](ecosystem/component-selection.md)
- [Common stack and command authority](technologies/common-stacks.md)
- [Verification harnesses](harnesses/verification-harnesses.md)
