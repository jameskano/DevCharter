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
- Ask only about unresolved choices that materially affect behavior, architecture, risk, scope, or
  acceptance.
- Generate an artifact only when evidence or an accepted decision justifies it. Prefer preserving
  an adequate project-owned file over replacing it.
- Give each proposed target one `create`, `update`, `skip`, or `conflict` decision and explain why.
- Record considered and rejected ecosystem components so omission is reviewable.

## Approval and safety

- `audit` is read-only: do not write, install dependencies, run mutating target commands, or create
  target-local state.
- `new` and `retrofit` produce a reviewable proposal before detailed planning.
- Proposal approval authorizes Markdown specification drafting, not implementation.
- Approved detailed specifications authorize only their stated scope and acceptance criteria.
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
