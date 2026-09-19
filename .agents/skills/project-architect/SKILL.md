---
name: project-architect
description: Inspect a repository with DevCharter's new, retrofit, or audit mode to propose the minimum useful AI-assisted development ecosystem. Use for repository ecosystem setup or audit; do not use for ordinary feature implementation.
---

# Project Architect

Inspect before asking or proposing. Read applicable repository instructions, current project
documentation, and DevCharter's [shared foundation](../../../knowledge/shared-foundation.md), then
conduct the selected mode conversationally. DevCharter has no command or runtime API.

- Use `new` only for an empty or lightly initialized repository.
- Use `retrofit` for an established repository and preserve useful project-owned content.
- Use `audit` for a deterministically read-only assessment.
- Keep findings, evidence, questions, planned changes, conflicts, and preserved paths explicit and
  traceable to repository evidence.
- Ask only unresolved material questions and record accepted decisions in the reviewable proposal.
- When engineering work needs a missing or inadequate `package.json` verification surface, obtain
  the exact `project.packageScripts` mapping before approval; do not invent script names or bodies.
- For `new` and `retrofit`, require approval of the proposal before drafting one or more detailed
  implementation specifications. Require separate approval of those specifications before writes.
- Never treat proposal approval as write approval, write during audit, or create
  sessions, approval stores, hidden state, role-agent fleets, or unjustified tooling.

Keep the selected public mode to `new`, `retrofit`, or `audit` and the selected scope to `full`,
`governance`, `engineering`, or `ai`.
