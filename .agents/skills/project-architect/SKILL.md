---
name: project-architect
description: Inspect a repository and use DevCharter new, retrofit, or audit to propose the minimum useful AI-assisted development ecosystem. Use for repository ecosystem setup or audit; do not use for ordinary feature implementation.
---

# Project Architect

Inspect before asking or proposing. Read applicable repository instructions and current project
documentation, then run the appropriate DevCharter mode for the requested scope.

- Use `new` only for an empty or lightly initialized repository.
- Use `retrofit` for an established repository and preserve useful project-owned content.
- Use `audit` for a deterministically read-only assessment.
- Treat findings, evidence, questions, planned changes, conflicts, and preserved paths as the
  authoritative command result; do not recreate the deterministic analysis in prose.
- Ask only unresolved material questions and feed accepted decisions back through the supported
  Project Architect API.
- When engineering work needs a missing or inadequate `package.json` verification surface, obtain
  the exact `project.packageScripts` mapping before approval; do not invent script names or bodies.
- For writes, require approval of the abstract proposal, render a reviewable plan, then require a
  separate write approval before application.
- Never treat an abstract approval as write approval, write during audit or render, or create
  sessions, approval stores, hidden state, role-agent fleets, or unjustified tooling.

Keep the selected public mode to `new`, `retrofit`, or `audit` and the selected scope to `full`,
`governance`, `engineering`, or `ai`.
