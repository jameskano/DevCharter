# Codex entrypoint

Codex can read DevCharter directly from a local checkout or GitHub repository while operating on a
separate target repository.

1. Confirm the five invocation inputs in the [root entrypoint](../../README.md).
2. Read applicable target-repository instructions before making decisions.
3. Use the repository-native [Project Architect skill](../../.agents/skills/project-architect/SKILL.md).
4. Route approved detailed specification work to the
   [Specification Architect skill](../../.agents/skills/specification-architect/SKILL.md).

This is a routing entrypoint, not the completed Codex-native integration. SPEC-0002C owns native
packaging, installation, and qualification.
