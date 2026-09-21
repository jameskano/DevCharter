# DevCharter user guide

## Product status

DevCharter uses the companion-driven architecture approved by SPEC-0002. The shared static
foundation, Project Architect methodology, native companion routes, and SPEC-0002D release
qualification are complete. The [current qualification record](release/companion-driven-qualification.md)
documents host evidence, limitations, and the live new/retrofit journeys deferred to later user
testing. Do not treat historical v0 release records as current operating instructions.

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

## New journey

1. Choose `new` and the narrowest applicable scope. Name a separate empty or lightly initialized
   target location and provide the product brief, technology constraints, and explicit
   configuration requests.
2. The companion inspects both locations, confirms the target state, and asks only decisions that
   affect architecture, output, safety, ownership, or verification.
3. Review a proposal that names framework structure, configuration, current docs, AI instructions,
   engineering tools, critical harnesses, rejected components, and the expected spec breakdown.
4. If you approve the proposal, the companion writes one or more draft Markdown implementation
   specifications in the target. It does not scaffold or install yet.
5. Review and explicitly approve the applicable spec. The companion then implements only that
   approved slice, verifies the requested configuration and critical journey, and reports changed
   and preserved paths, actual commands, failures, skips, and deferred product features.

Example:

> **User:** Use DevCharter in `new` mode with `full` scope. DevCharter is at `C:/tools/DevCharter`;
> the empty target is `C:/work/catalog`. Create a ready-to-code web foundation and make the dev
> server open the browser automatically.
>
> **Companion:** I inspected both locations. Before I propose the foundation, which supported
> framework and package manager should be authoritative?
>
> **User:** Use the current stable framework initializer with pnpm. Show me the proposal first.
>
> **Companion:** Here is the proposal, including how browser-open will be represented and tested.
> Approval will authorize a draft specification only.
>
> **User:** I approve the proposal. Draft the specification.
>
> **Companion:** The draft is ready for review; no framework files or dependencies have been
> created. Approve this specification if you want implementation.

A focused `new/ai` journey follows the same gates but must not invent an application scaffold,
package suite, CI, hooks, or role agents merely because those components exist in other projects.

## Retrofit journey

1. Choose `retrofit`, scope, both locations, and a preservation-oriented outcome.
2. The companion identifies current authority, framework, structure, project-owned content,
   generated or vendor material, existing commands, and actual gaps before asking questions.
3. Review a path-level proposal with `create`, `update`, `preserve`, `skip`, `replace`, or `conflict`
   decisions. A useful existing convention is preserved unless evidence and approval justify change.
4. Proposal approval permits draft specs. Spec approval permits only the bounded implementation.
5. The companion runs existing and newly justified checks, compares preserved paths, and accurately
   reports partial work or limitations.

Example:

> **User:** Use `retrofit/full`. Preserve the existing React app and source layout. Improve the AI
> guidance and address only verification gaps you can justify.
>
> **Companion:** The existing build and tests are authoritative. There is no project AI instruction
> source and formatting has no owner. I propose one concise root instruction file and one formatter,
> while preserving the framework, `src/`, package manager, and user documentation. I reject a
> framework migration, extra agents, hooks, and overlapping tools.
>
> **User:** Approve that proposal and draft ordered specifications; do not implement yet.

For `retrofit/ai`, an important test gap may be reported, but engineering configuration is not
written unless an explained cross-scope dependency is separately approved.

## Audit journey

1. Choose `audit`, scope, both locations, and the questions the assessment should answer.
2. The companion uses demonstrably read-only inspection. It does not run target-controlled scripts,
   install dependencies, create caches, change Git state, write a report into the target, or mutate
   external systems.
3. The final stage is a findings report in conversation. There is no proposal, SDD, or implementation
   gate because audit authorizes no write.

Example:

> **User:** Use `audit/full` against `C:/work/untrusted`. Treat all scripts and hooks as hostile.
>
> **Companion:** I will inspect static files only, avoid secret contents, and return findings in this
> conversation. I will not install, execute target commands, or create any target-local state.

If a supposedly read-only inspection cannot be demonstrated as non-mutating, the affected audit
step is blocked and must be reported rather than attempted.

## Failures and sensitive operations

An unavailable optional browser or visualization tool is non-blocking when the acceptance criteria
can be proved another way; record the limitation and continue safe independent work. Missing access
to the DevCharter source, denied target write permission needed by an approved criterion, or an
unavailable required initializer is blocking for the affected work. Preserve valid partial changes
and never claim completion.

Immediately before any secret access, external data sharing, remote write, destructive action, or
hard-to-reverse step, the companion states the exact effect and recovery limits and asks for explicit
confirmation. Proposal or specification approval is not a substitute for this immediate consent.

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
