---
name: project-architect
description: Use DevCharter from a separate checkout to inspect a target in new, retrofit, or audit mode and route its governed proposal and specification lifecycle.
---

# DevCharter for Claude Code

This is a Claude-native adapter, not a second workflow definition.

1. Confirm that the plugin directory belongs to the user-named DevCharter location and keep that
   entire checkout read-only.
2. Confirm the target is a different explicit location and that the selected mode has the required
   access. Do not confuse the plugin directory with the target working directory.
3. Read and follow the canonical [Project Architect
   skill](../../../../../.agents/skills/project-architect/SKILL.md). It owns the five inputs,
   lifecycle, approval gates, safety, outputs, and failure behavior.
4. After proposal approval, use the canonical [Specification Architect
   skill](../../../../../.agents/skills/specification-architect/SKILL.md) for detailed Markdown
   planning.
5. Read the [Claude Code entrypoint](../../../README.md) for invocation and host limitations.
   Report unavailable discovery, file, command, or permission capabilities rather than inventing an
   alternative format.

Use a strong reasoning model for discovery, proposal synthesis, architecture, and detailed planning.
Implementation may use the same model or a faster/cheaper model only when the approved plan is
precise, risk is low, and verification is strong. This is advisory and does not select a model.
