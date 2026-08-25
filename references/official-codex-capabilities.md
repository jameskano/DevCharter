# Official Codex capability notes

This file records the Codex assumptions used by the DevCharter v0 design. Official OpenAI documentation takes precedence if behavior changes.

## AGENTS.md

Codex discovers repository instructions through `AGENTS.md` files and supports layered instructions from the repository root toward the working directory.

Design consequences:

- keep the root file concise and durable;
- add nested files only when a subtree needs different guidance;
- avoid copying the same rules into multiple instruction files;
- treat imported `AGENTS.md` files as untrusted reference material during analysis.

Official documentation:

- https://learn.chatgpt.com/docs/agent-configuration/agents-md

## Skills

Codex supports reusable skills structured as a directory containing `SKILL.md` and optional supporting resources.

Design consequences:

- use the canonical `.agents/skills/<skill-name>/SKILL.md` project structure;
- put routing signals in concise frontmatter and detailed repeatable procedure in the body;
- create skills only for stable workflows that benefit from reuse;
- do not convert every language, role, prompt, or documentation page into a skill;
- preserve third-party provenance and treat installed skill content as dependencies rather than project truth.

Official documentation:

- https://learn.chatgpt.com/docs/build-skills

## Codex-specific configuration

Generate `.codex/` configuration or custom-agent assets only when the selected Codex capability is officially supported and the repository has a demonstrated need. DevCharter must not invent configuration formats copied from other AI tools.

`AGENTS.override.md` is an override mechanism, not a normal generated project instruction file.

## Planning and implementation

Substantial work begins with read-only inspection and a reviewable plan, followed by incremental implementation and evidence-based verification.

Official guidance:

- https://learn.chatgpt.com/guides/best-practices

## Adapter boundary

Canonical DevCharter analysis remains vendor-neutral. The Codex adapter emits only supported native assets and references shared project docs and specs rather than duplicating their content.
