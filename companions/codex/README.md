# Codex native entrypoint

Codex uses DevCharter's root `AGENTS.md` and repository skills as its native route. DevCharter stays
read-only guidance and the target remains a separate explicit location.

## Start

Make both locations accessible. In Codex CLI, one supported shape is to start with DevCharter as the
working root and add the target:

```text
codex --cd <devcharter-location> --add-dir <target-location>
```

In the desktop app, attach both local folders and make DevCharter the primary folder so its skills
are discovered. These mechanisms can technically permit source writes; do not write to DevCharter.
Use a read-only filesystem or a scoped permission profile when policy enforcement is required.

Then provide or ask for all five inputs before analysis:

```text
Use DevCharter.
Mode: <new|retrofit|audit>
Scope: <full|governance|engineering|ai>
DevCharter location: <readable checkout or accessible GitHub location>
Target location: <separate target path or repository>
Initial context: <plain text and/or Markdown or repository files>
```

Invoke the native `project-architect` skill, or ask Codex to read the canonical [Project Architect
skill](../../.agents/skills/project-architect/SKILL.md). It owns discovery, outputs, failures, and
the proposal approval gate. After proposal approval, route detailed Markdown planning to the
[Specification Architect skill](../../.agents/skills/specification-architect/SKILL.md). Separate
explicit specification approval is required before implementation.

## Codex-specific boundaries

- Read applicable target `AGENTS.md` files and current project evidence. Do not apply DevCharter's
  contributor rules as target policy.
- Do not require a DevCharter CLI, package, JSON protocol, fingerprint, hosted service, or
  target-local copy.
- Classify unavailable file, command, network, browser, or permission capabilities as blocking or
  non-blocking under the shared [integration
  contract](../../knowledge/companion-integration-contract.md). Never invent a replacement format.
- Reconfirm destructive actions, secret access, external data sharing, remote writes, migrations,
  and other hard-to-reverse effects immediately before execution even when Codex permits them.
- Propose `.codex/` configuration or any other native target artifact only when its purpose,
  ownership, repository evidence, and verification justify it.

Use a strong reasoning model for repository discovery, proposal synthesis, architecture, and
detailed planning. Implementation may use the same model or a faster/cheaper option only when the
approved specification is precise, risk is low, and verification is strong. The advice is
provider-neutral and does not select or route a model.

See the dated [Codex capability record](../../references/official-codex-capabilities.md) for host and
permission limitations.
