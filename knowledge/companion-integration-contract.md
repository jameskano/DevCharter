# Companion integration contract

This contract makes the canonical [Project Architect
skill](../.agents/skills/project-architect/SKILL.md) testable across supported companions. It does
not redefine that skill. If this file, a companion adapter, or a capability note conflicts with the
skill, the skill controls.

## Invocation

Before analysis, every integration obtains and verifies:

1. mode: exactly `new`, `retrofit`, or `audit`;
2. scope: exactly `full`, `governance`, `engineering`, or `ai`;
3. DevCharter location: readable guidance, distinct from the target, and kept read-only;
4. target location: identifiable and accessible at the level required by the selected mode; and
5. initial context: non-empty chat text and/or readable Markdown or repository files.

A missing or unusable input is requested explicitly. A companion may recommend a different mode or
scope from evidence, but it does not substitute one silently.

## Shared stages and gates

| Stage | Required result | Gate |
|---|---|---|
| Invocation | Five verified inputs and any access limitation | No analysis with a missing required input |
| Discovery | Read-only evidence, every unresolved material question over as many rounds as needed, and explicit uncertainty | No target mutation |
| Audit | Findings only | Ends without target writes or external side effects |
| Proposal | Reviewable create/update/preserve/skip/conflict decisions and rejected components, produced in native Plan mode or ordinary conversation | Explicit proposal approval authorizes specification drafting only |
| Detailed planning | One target-local Markdown draft specification by default, or justified related and ordered drafts, through Specification Architect | Explicit approval of each applicable specification |
| Implementation | Only approved behavior, with sensitive actions reconfirmed immediately before execution | Stop affected work on material deviation or blocking capability failure |
| Verification | Actual commands and journey evidence, including failures, timeouts, and skips | Completion evidence maps every acceptance criterion |

Proposal approval authorizes detailed specification work only. Specification approval authorizes
implementation only within the approved specification. The companion never substitutes a host
permission prompt for either approval gate.

Native Plan mode is optional and does not add a DevCharter mode. When used for `new` or `retrofit`,
its reviewable output is the DevCharter proposal, even if the host calls it an implementation plan.
Before approval, state that acceptance permits only Markdown specification authoring. Do not use a
host action that immediately starts coding; if the planning surface is read-only, switch modes only
after proposal approval and only to author the draft specifications, then stop for their separate
review. Without suitable Plan mode, follow the identical discovery, questioning, proposal, and
approval contract in ordinary conversation. `audit` never enters this proposal flow.

A companion inspects repository-answerable facts first, omits immaterial preference questions, and
asks all remaining proposal-changing questions. It may retain one only after explicit deferral or
acceptance of a stated low-risk reversible assumption with evidence, impact if wrong, and
reversibility. Sensitive, externally visible, irreversible, and public-contract decisions cannot
be assumptions.

After specification approval, the same conversation may move one `ready` specification to
`active`. A later conversation may do the same after re-reading repository instructions, approval
metadata, status, relationships, current state, and the specification itself. Missing or
unverifiable approval, a non-ready status, conflict, or material staleness requires refreshed review
and approval rather than invented conversation state.

## Output and failure behavior

- DevCharter remains source guidance; it is not copied into target dependencies and no DevCharter
  CLI, package, JSON protocol, fingerprint, hosted service, or session store is required.
- Every proposed target instruction, skill, prompt, agent, hook, plugin, MCP configuration, or other
  native artifact identifies its purpose, ownership, evidence, and verification. Host support alone
  is not justification.
- An inaccessible DevCharter source blocks the lifecycle. An unwritable target blocks approved
  writes but not safe analysis that can still be verified.
- A missing optional tool is recorded and unaffected work continues. A missing capability required
  by an acceptance criterion stops the affected stage.
- Destructive actions, secret access, external data sharing, remote writes, migrations, and other
  hard-to-reverse effects require immediate explicit confirmation even when the host permits them.
- Attempted writes to the DevCharter source stop and are reported. Unrelated or external target
  changes are preserved.

## Semantic conformance matrix

| Concern | Codex | Claude Code | GitHub Copilot |
|---|---|---|---|
| Native route | `AGENTS.md` plus `.agents/skills` | Local `devcharter` plugin loaded with `--plugin-dir` | `.agents/skills` in CLI; `.github/prompts/devcharter.prompt.md` in supported IDEs |
| Canonical workflow | Project Architect skill | Adapter opens Project Architect skill | Project Architect skill or IDE prompt routes to it |
| Five inputs | Verify before analysis | Verify before analysis | Verify before analysis |
| Source/target boundary | Separate named locations; DevCharter read-only | Separate named locations; DevCharter read-only | Separate named locations; DevCharter read-only |
| Proposal surface | Surfaced Plan mode, or read-only permissions / ordinary conversation | `--permission-mode plan`, `/plan`, or `Shift+Tab` | CLI `--plan` / `/plan` / `Shift+Tab`, or supported IDE Plan agent |
| Approval gates | Proposal, then specification | Proposal, then specification | Proposal, then specification |
| Capability failure | Classify blocking/non-blocking | Classify blocking/non-blocking | Classify blocking/non-blocking |
| Sensitive action | Reconfirm immediately | Reconfirm immediately | Reconfirm immediately |
| Model guidance | Strong reasoning for discovery/proposal/planning; faster model allowed for low-risk precise implementation | Same provider-neutral guidance | Same provider-neutral guidance |
| Native target output | Individually justified | Individually justified | Individually justified |
| Output equality | Not required | Not required | Not required |

Host-specific setup and limitations live in the dated capability records and companion entrypoints,
not in this shared lifecycle contract.
