# DevCharter user guide

## Product status

DevCharter uses the companion-driven architecture approved by SPEC-0002. The shared static
foundation, Project Architect methodology, and qualified native companion routes are present.
SPEC-0002D remains the later full-lifecycle and release-transition work. Do not treat historical v0
release records as current operating instructions.

## What to provide

Begin every run with five inputs:

1. Mode: `new`, `retrofit`, or `audit`.
2. Scope: `full`, `governance`, `engineering`, or `ai`.
3. DevCharter location: a readable local folder or GitHub repository.
4. Target location: the separate project folder or repository.
5. Initial context: plain text and/or specification files.

Then open the selected [companion entrypoint](../companions/) and route to the
[Project Architect skill](../.agents/skills/project-architect/SKILL.md). Other capable companions may
follow the shared guidance on a best-effort basis, but are not represented as qualified integrations.

The companion validates the five inputs, inspects applicable target evidence before asking material
questions, and keeps DevCharter itself read-only. If the chosen mode or scope appears inconsistent
with the target, it explains the evidence and asks whether you want to change the selection rather
than silently substituting one.

## Companion setup

### Codex

Use DevCharter as the primary local folder so Codex discovers its `AGENTS.md` and `.agents/skills`,
then attach or add the separate target. In CLI this can be `codex --cd <devcharter-location>
--add-dir <target-location>`. Read the [Codex entrypoint](../companions/codex/README.md) before
starting the lifecycle.

### Claude Code

Start Claude Code in the target with `claude --add-dir <devcharter-location> --plugin-dir
<devcharter-location>/companions/claude-code/plugin`, then invoke
`/devcharter:project-architect`. The added directory supplies file access and the session-local
plugin supplies the Claude-native skill; `--add-dir` alone does not discover most customizations
from that directory. Read the [Claude Code entrypoint](../companions/claude-code/README.md) for
version and policy limitations.

### GitHub Copilot

For Copilot CLI, add `<devcharter-location>/.agents/skills` to `COPILOT_SKILLS_DIRS`, start in the
target, and invoke `/project-architect`. VS Code, Visual Studio, and JetBrains can instead use the
preview `/devcharter` prompt when both locations are readable. Read the [GitHub Copilot
entrypoint](../companions/github-copilot/README.md); prompt files and other customizations are not
universal across Copilot hosts.

All three routes follow the shared [integration
contract](../knowledge/companion-integration-contract.md). If a required file, command, network, or
permission capability is unavailable, the companion reports the affected task and consequence. It
continues safe independent work only for non-blocking limitations and stops at an affected gate for
blocking limitations. A technically permitted sensitive action still requires immediate explicit
confirmation.

Use a strong reasoning model for discovery, proposal synthesis, architecture, and detailed planning.
Implementation may use the same model or a faster/cheaper option when the approved specification is
precise, risk is low, and verification is strong. This is provider-neutral advice, not model routing.

For another capable companion, supply the five inputs and ask it to read the root entrypoint, shared
foundation, and Project Architect skill directly. This is best effort only: DevCharter makes no
support or output-quality claim and defines no fourth provider contract.

## Choose a mode

| Mode | Use when | Result before approval |
|---|---|---|
| `new` | The target is empty or lightly initialized | A minimum-sufficient proposal |
| `retrofit` | The target is established | A preservation-aware proposal |
| `audit` | Findings only are wanted | A read-only report; no proposal or writes |

## Choose a scope

- `full`: governance, engineering, and AI.
- `governance`: current truth, decisions, documentation, and specifications.
- `engineering`: development and verification foundations.
- `ai`: developer-AI instructions and justified companion assets.

## Approval model

For new and retrofit, the companion first inspects and asks only unresolved material questions. It
then presents a reviewable proposal, including create/update/skip/conflict decisions and rejected
components. Explicit proposal approval authorizes one or more detailed Markdown specifications.

The Specification Architect creates one cohesive draft by default and splits it only when size,
risk, independent subsystems, or dependency order makes that clearer. Only explicit approval of the
detailed specification authorizes implementation. A discovered material expansion stops affected
work until the specification is updated and reapproved.

Approval never removes the need for immediate confirmation before destructive actions, secret
access, external data sharing, remote writes, or hard-to-reverse operations.

## Safety and preservation

- DevCharter source and target locations remain separate.
- Target instructions and useful project-owned content are preserved.
- Audit performs no writes, installations, mutating commands, or target-local state creation.
- Third-party, generated, secret-like, unreadable, binary, and ambiguous content is handled
  conservatively.
- No credentials, full transcripts, hidden reasoning, or session state are persisted.
- Partial work, failures, timeouts, skipped checks, and limitations are reported accurately.

## Verification and completion

The companion runs the target's authoritative checks that apply to the approved change, beginning
with narrow checks and broadening according to risk. Critical journeys require journey-level
evidence when relevant. Completion includes implementation evidence, documentation review, actual
command results, limitations, deferred work, and a reviewable diff.

## Contributor checks

DevCharter maintainers use `npm run verify` from the DevCharter repository. This checks only static
DevCharter-owned assets and does not install or execute anything in a target.

## Historical v0 evidence

The [v0 qualification](release/v0-qualification.md),
[Habit Compass pilot](release/habit-compass-pilot.md), SPEC-0001, and SPEC-0001A-E are retained to
explain prior behavior and migration decisions. They are not current user instructions.
