# Official Codex capability record

Verified against official OpenAI documentation and the locally available Codex host on 2026-09-22.
Provider behavior can change; recheck these sources before relying on a version- or host-specific
capability.

## Native surfaces used

- Codex reads `AGENTS.md` before work and layers repository instructions from the repository root
  toward the working directory. `AGENTS.override.md` is an override, not a normal generated file.
- Repository skills live at `.agents/skills/<skill-name>/SKILL.md`. Codex scans that directory from
  the current working directory toward the repository root and loads full skill instructions only
  when the skill is selected.
- Codex CLI supports `--cd` to choose the working root and repeatable `--add-dir` to grant another
  directory write access. The desktop app supports multiple attached local folders, but automatic
  instruction, skill, and `.codex/config.toml` discovery uses the primary folder; secondary folders
  remain accessible.
- Local commands and filesystem changes remain subject to the active permission profile, sandbox,
  approvals, managed policy, and workspace roots. Host permission does not replace DevCharter's
  proposal, specification, or sensitive-action confirmations.
- Official best-practice guidance documents native Plan mode across the CLI, IDE extension, and
  desktop app as a way to gather context, ask clarifying questions, and plan before implementation;
  use `/plan` or `Shift+Tab` to enter it. DevCharter uses that mode only for the proposal stage.
- `/permissions` can additionally select a read-only profile when the user wants inspection and
  planning without changes.

DevCharter therefore uses the existing root `AGENTS.md` and canonical `.agents/skills` without a
Codex-only copy. The companion entrypoint explains how to expose both separately named locations.

## Deliberate limitations

- `--add-dir` and desktop folder attachment can make both folders technically writable. The
  DevCharter workflow keeps the source checkout read-only and treats an attempted source write as a
  blocking error; users who require enforcement should also use a read-only filesystem or a scoped
  permission profile.
- Codex cloud currently centers work on one remote repository. Use a checked-out DevCharter source
  available to the environment or direct Markdown context; a remote read-only view cannot claim
  application capability.
- The official Plan-mode guidance does not redefine DevCharter's approval lifecycle or establish
  that accepting a plan is approval of a target-local implementation specification. If native Plan
  mode is unavailable in the current host, use a read-only permission profile or ordinary
  conversation and preserve the same DevCharter gates.
- `.codex/config.toml`, subagents, hooks, plugins, and MCP configuration are not required. Generate
  them for a target only when current capability and target evidence independently justify them.
- A large skill catalog can truncate discovery metadata. DevCharter exposes two focused skills and
  does not add provider-role or helper skill fleets.

## Official sources

- `AGENTS.md` discovery and precedence:
  https://learn.chatgpt.com/docs/agent-configuration/agents-md
- Repository skill discovery and structure:
  https://learn.chatgpt.com/docs/build-skills
- CLI `--cd`, `--add-dir`, sandbox, and approval flags:
  https://learn.chatgpt.com/docs/developer-commands?surface=cli
- Multiple folders and primary-folder discovery in local projects:
  https://learn.chatgpt.com/docs/projects
- Permission profiles and workspace roots:
  https://learn.chatgpt.com/docs/permissions
- Read-only planning and `/permissions` behavior:
  https://learn.chatgpt.com/docs/agent-approvals-security
- Plan mode, `/plan`, and `Shift+Tab`:
  https://learn.chatgpt.com/guides/best-practices
