# Claude Code native entrypoint

Claude Code uses the local DevCharter plugin and its native `/devcharter:project-architect` skill.
DevCharter stays read-only guidance and the target remains a separate explicit location.

## Start

Start Claude Code in the target, add the DevCharter checkout for file access, and load its local
plugin for native skill discovery:

```text
claude --add-dir <devcharter-location> --plugin-dir <devcharter-location>/companions/claude-code/plugin
```

`--add-dir` alone does not discover most `.claude/` customizations from an additional directory;
`--plugin-dir` is the supported session-local reusable-workflow route. Invoke
`/devcharter:project-architect` and provide or ask for all five inputs before analysis:

```text
/devcharter:project-architect
Mode: <new|retrofit|audit>
Scope: <full|governance|engineering|ai>
DevCharter location: <the added read-only checkout>
Target location: <the separate working target>
Initial context: <plain text and/or Markdown or repository files>
```

The adapter routes to the canonical [Project Architect
skill](../../.agents/skills/project-architect/SKILL.md), which owns discovery, outputs, failures,
and the proposal approval gate. After proposal approval, route detailed Markdown planning to the
[Specification Architect skill](../../.agents/skills/specification-architect/SKILL.md). Separate
explicit specification approval is required before implementation.

## Claude Code-specific boundaries

- `--add-dir` grants read and edit capability. Treat the named DevCharter checkout as read-only and
  write only to the approved target. Apply host or filesystem read-only controls when enforcement
  is required.
- Do not assume Codex file names are Claude-native or that `--add-dir` discovers DevCharter's
  customizations. The local plugin is the native discovery surface; current `AGENTS.md`
  compatibility is useful but host/version-dependent.
- Do not require a DevCharter CLI, package, JSON protocol, fingerprint, hosted service, or
  target-local copy.
- Classify unavailable file, command, network, or permission capabilities as blocking or
  non-blocking under the shared [integration
  contract](../../knowledge/companion-integration-contract.md). Never invent a replacement format.
- Reconfirm destructive actions, secret access, external data sharing, remote writes, migrations,
  and other hard-to-reverse effects immediately before execution even when Claude Code permits
  them.
- Propose `CLAUDE.md`, rules, skills, agents, hooks, plugins, MCP, or other native target artifacts
  only when each artifact has a justified purpose, ownership, evidence, and verification.

Use a strong reasoning model for repository discovery, proposal synthesis, architecture, and
detailed planning. Implementation may use the same model or a faster/cheaper option only when the
approved specification is precise, risk is low, and verification is strong. The advice is
provider-neutral and does not select or route a model.

See the dated [Claude Code capability
record](../../references/official-claude-code-capabilities.md) for version, host, and permission
limitations.
