# DevCharter user guide

## Product status

DevCharter is transitioning to the companion-driven architecture approved by SPEC-0002. The shared
static foundation is present; the full methodology, native companion integrations, and end-to-end
qualification are delivered by the ordered SPEC-0002B-D work. Do not treat historical v0 release
records as current operating instructions.

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

The Specification Architect makes acceptance criteria, risks, scope, and verification reviewable.
Only explicit approval of that detailed specification authorizes implementation. A discovered
material expansion stops affected work until the specification is updated and reapproved.

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
