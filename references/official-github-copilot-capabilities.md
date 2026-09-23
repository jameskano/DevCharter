# Official GitHub Copilot capability record

Verified against official GitHub documentation on 2026-09-22. Copilot surfaces differ materially by
host and change over time; recheck the support matrix before claiming a capability is universal.

## Native surfaces used

- Copilot CLI reads repository instructions including `AGENTS.md`,
  `.github/copilot-instructions.md`, and `.github/instructions/**/*.instructions.md`. It combines
  applicable files and does not define a general precedence order, so conflicting copies must be
  avoided.
- Copilot CLI discovers project skills in `.github/skills`, `.claude/skills`, or `.agents/skills`.
  `COPILOT_SKILLS_DIRS` can add skill directories outside the target. The canonical DevCharter
  `.agents/skills` directory is therefore the CLI workflow surface; no Copilot-only skill copy is
  needed.
- `COPILOT_CUSTOM_INSTRUCTIONS_DIRS` can add external `AGENTS.md` and modular instruction files.
  DevCharter does not require it because the explicit companion entrypoint and canonical skill are
  sufficient and avoid applying DevCharter contributor instructions to the target.
- Copilot prompt files at `.github/prompts/*.prompt.md` are a public-preview IDE feature available
  in VS Code, Visual Studio, and JetBrains IDEs. DevCharter includes one routing prompt for those
  hosts; it is not presented as a universal Copilot feature.
- Repository-wide and path-specific instruction support varies across IDE chat, coding agent, code
  review, GitHub.com, and CLI. A target receives any such artifact only when its selected host and
  repository evidence justify it.
- Copilot CLI supports plan mode through `--plan`, `/plan`, or the `Shift+Tab` mode cycle. It
  analyzes the codebase, asks clarifying questions, creates a structured plan, and waits for
  approval. The separate plan-then-autopilot option intentionally skips the human transition.
- Supported IDE chat surfaces expose a Plan agent that uses read-only research, accepts iterative
  clarification, and offers “Start Implementation” or Markdown-oriented handoff controls after
  review.

## Deliberate limitations

- The first-class reusable workflow is implemented for Copilot CLI. An authenticated CLI audit
  journey was recorded on 2026-09-20 in the release qualification evidence. The IDE prompt is an
  additional preview route, not a guarantee for Xcode, Eclipse, GitHub Mobile, code review, or every
  agent host.
- Copilot access, agent mode, filesystem edits, terminal commands, models, and customization
  features depend on plan, policy, IDE/CLI version, workspace trust, permissions, and preview
  availability.
- GitHub-hosted experiences can use only repositories and attachments available to that session. A
  read-only view can analyze but cannot claim target application capability.
- Custom agents, hooks, plugins, MCP, and extra instruction files are not required for DevCharter.
  They remain target outputs that need individual evidence, ownership, and verification.
- DevCharter must not use plan-then-autopilot, “Accept plan and build on autopilot,” or “Start
  Implementation” at the proposal gate. Those controls would collapse proposal approval into
  implementation; the host must instead author the separately reviewed Markdown specifications.

## Official sources

- Copilot CLI custom instructions and external instruction directories:
  https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions
- Copilot CLI agent skills and supported project locations:
  https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills
- Copilot customization and host support matrix:
  https://docs.github.com/en/copilot/reference/custom-instructions-support
- Repository and path-specific instructions on GitHub:
  https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
- IDE prompt files and their preview limitation:
  https://docs.github.com/en/copilot/how-tos/configure-custom-instructions-in-your-ide/add-repository-instructions-in-your-ide
- CLI filesystem and command permission behavior:
  https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-copilot-cli
- Copilot CLI plan mode and plan-then-autopilot:
  https://docs.github.com/en/copilot/how-tos/copilot-cli/cli-best-practices
  https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference
- IDE Plan agent, iterative review, and implementation controls:
  https://docs.github.com/en/copilot/how-tos/chat-with-copilot/chat-in-ide
