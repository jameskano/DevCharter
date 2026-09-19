# Official Claude Code capability record

Verified against official Anthropic documentation on 2026-09-19. Provider behavior can change;
recheck these sources before relying on a version- or host-specific capability.

## Native surfaces used

- Claude Code loads project instructions from `CLAUDE.md` and, in Claude Code v2.1.277 or later,
  can read `AGENTS.md` when no project `CLAUDE.md` takes precedence. Some third-party-provider or
  telemetry-disabled sessions cannot load `AGENTS.md` directly, so DevCharter does not depend on
  that compatibility path.
- Project skills live at `.claude/skills/<name>/SKILL.md`, but most `.claude/` customizations are not
  discovered from a directory supplied only through `--add-dir`. That flag adds a working directory
  for file access; loading memory from it is separately controlled and does not make it a native
  skill source.
- Reusable cross-project workflows can be packaged as plugins. A plugin root contains
  `.claude-plugin/plugin.json` and root-level `skills/<name>/SKILL.md`; `--plugin-dir` loads the local
  plugin for the current session without copying it into the target. Plugin skills are namespaced.
- `--add-dir` grants Claude Code read and edit access to an additional local directory. Network
  paths and organization policy can restrict this behavior.
- Claude Code can inspect and edit files and run commands subject to its permission mode, sandbox,
  organization policy, and the user's approvals. Host permission does not replace DevCharter's
  proposal, specification, or sensitive-action confirmations.

DevCharter therefore supplies a thin local plugin under `companions/claude-code/plugin`. Start
Claude Code in the target, pass the DevCharter checkout through `--add-dir` for source access, and
pass the plugin directory through `--plugin-dir` for native discovery. The namespaced
`/devcharter:project-architect` skill routes to the canonical Project Architect without copying
lifecycle policy.

## Deliberate limitations

- The integration is for Claude Code local/CLI sessions that can read both named locations. Claude
  web chat, Cowork, remote sessions, third-party providers, managed policy, or older versions may
  discover different instruction or skill sets.
- `CLAUDE.md`, rules, hooks, subagents, plugins, and MCP configuration are not required by
  DevCharter and are proposed for a target only when target evidence independently justifies them.
- `--add-dir` makes the DevCharter checkout technically editable. The DevCharter workflow keeps it
  read-only and treats an attempted source write as a blocking error; users who require enforcement
  should also apply host or filesystem read-only controls.
- `--plugin-dir` is a session-local loading and development surface, not marketplace installation.
  DevCharter does not require an installed plugin, marketplace, target-local copy, hook, MCP server,
  or plugin-provided executable.

## Official sources

- Project instructions and `AGENTS.md` compatibility:
  https://code.claude.com/docs/en/memory
- Skills, additional-directory discovery, and host limitations:
  https://code.claude.com/docs/en/skills
- Built-in command behavior, including the limits of `/add-dir` customization discovery:
  https://code.claude.com/docs/en/commands
- Local plugin structure, namespacing, and `--plugin-dir` loading:
  https://code.claude.com/docs/en/plugins
- CLI `--add-dir` and permission-related flags:
  https://code.claude.com/docs/en/cli-reference
- Permissions and sandbox behavior:
  https://code.claude.com/docs/en/permissions
