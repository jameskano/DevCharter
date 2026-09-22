# GitHub Copilot native entrypoint

The primary reusable route is GitHub Copilot CLI using the canonical DevCharter agent skill.
Supported Copilot IDEs also have a preview prompt-file route. DevCharter stays read-only guidance
and the target remains a separate explicit location.

## Copilot CLI

Start Copilot CLI in the target after adding `<devcharter-location>/.agents/skills` to
`COPILOT_SKILLS_DIRS`. Invoke `/project-architect` and provide or ask for all five inputs before
analysis:

```text
Mode: <new|retrofit|audit>
Scope: <full|governance|engineering|ai>
DevCharter location: <readable checkout or accessible GitHub location>
Target location: <the separate working target>
Initial context: <plain text and/or Markdown or repository files>
```

Use `/skills info project-architect` when needed to verify discovery. Do not add the DevCharter root
to `COPILOT_CUSTOM_INSTRUCTIONS_DIRS`: that would apply DevCharter contributor instructions to the
target. The skill routes approved detailed Markdown planning to the [Specification Architect
skill](../../.agents/skills/specification-architect/SKILL.md). Proposal approval and specification
approval remain separate gates.

For `new` or `retrofit`, start Copilot CLI with `--plan`, use `/plan`, or press `Shift+Tab` to select
plan mode. Do not use `--plan --mode autopilot`, plan-then-autopilot, or “Accept plan and build on
autopilot”: those controls deliberately proceed into implementation and would bypass DevCharter's
Markdown-specification gate. Treat the Copilot plan as the DevCharter proposal. After explicit
proposal approval, exit plan mode only to run Specification Architect and author the approved draft
specification or specifications, then stop for separate review.

## Copilot IDE preview route

In VS Code, Visual Studio, or JetBrains with prompt files enabled, open a workspace that can read
both locations and invoke the repository prompt `/devcharter` from
`.github/prompts/devcharter.prompt.md`. The prompt routes to the canonical [Project Architect
skill](../../.agents/skills/project-architect/SKILL.md). Prompt files are a public-preview feature
and are not supported by every Copilot host.

Where the IDE exposes the Plan agent, select it for discovery and proposal work. Do not select
“Start Implementation” at the proposal gate. After explicit proposal approval, switch to an
editing-capable agent only with an instruction to create the target-local Markdown specifications
through Specification Architect and perform no product implementation. Ordinary conversation is
the fallback when the current Copilot host lacks a suitable Plan mode.

## Copilot-specific boundaries

- GitHub.com, coding agent, code review, IDE chat, and CLI do not share every customization
  capability. Confirm the active host from the dated capability record; do not silently assume a
  prompt, skill, path instruction, filesystem edit, or terminal capability.
- Do not require a DevCharter CLI, package, JSON protocol, fingerprint, hosted service, or
  target-local copy.
- Classify unavailable file, command, network, or permission capabilities as blocking or
  non-blocking under the shared [integration
  contract](../../knowledge/companion-integration-contract.md). A read-only remote view may analyze
  but cannot claim application capability.
- Reconfirm destructive actions, secret access, external data sharing, remote writes, migrations,
  and other hard-to-reverse effects immediately before execution even when Copilot permits them.
- Propose repository instructions, path-specific instructions, skills, prompts, agents, hooks,
  plugins, MCP, or other native target artifacts only when each has a justified purpose, ownership,
  evidence, and verification.
- After explicit specification approval, implementation may continue in the same conversation or a
  later one that re-verifies the spec's status, approval metadata, relationships, and current state.

Use a strong reasoning model for repository discovery, proposal synthesis, architecture, and
detailed planning. Implementation may use the same model or a faster/cheaper option only when the
approved specification is precise, risk is low, and verification is strong. The advice is
provider-neutral and does not select or route a model.

See the dated [GitHub Copilot capability
record](../../references/official-github-copilot-capabilities.md) for host, plan, preview, and
permission limitations.
