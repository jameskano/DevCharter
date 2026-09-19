---
agent: 'agent'
description: 'Run DevCharter against a separately identified target'
---

Use the DevCharter checkout in this workspace as read-only guidance for a separate target.

Before analysis, collect or verify all five inputs: mode, scope, DevCharter location, target
location, and initial context. Read [the GitHub Copilot
entrypoint](../../companions/github-copilot/README.md), then follow the canonical [Project Architect
skill](../../.agents/skills/project-architect/SKILL.md). Do not restate or replace its lifecycle.

Use a strong reasoning model for discovery, proposal synthesis, architecture, and detailed planning.
A faster or cheaper model is suitable for implementation only when the approved specification is
precise, risk is low, and verification is strong. Report host limitations and stop at affected
gates instead of assuming unavailable tools or permissions.
