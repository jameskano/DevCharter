# Companion integration walkthrough results

These results record fresh-context adapter walkthroughs on 2026-09-19. They test routing and
observable decisions, not deterministic model wording. The shared methodology scenarios continue
to own new, retrofit, audit, approval, preservation, and overengineering evidence.

## Codex

Real-host journey: a fresh Codex context received all five inputs for `audit` / `ai`, with
DevCharter at this checkout and a separate disposable target at
`%TEMP%/devcharter-codex-target`. It followed `companions/codex/README.md` into the canonical
Project Architect skill and its necessary knowledge dependencies. The target contained only a
149-byte `README.md`. The audit preserved that file, skipped a root instruction file pending real
project evidence, and rejected nested instructions, skills, prompts, agents, hooks, plugins, MCP,
and `.codex/` configuration as unjustified.

The target inventory and SHA-256 were captured before and after the fresh session. Both snapshots
contained only `README.md` with hash
`07CF994190BF1989B8591EC5316E83BFD664709C280719C9203B39BA03643C6F`; no target or DevCharter write
occurred. This exercises the five-input route, separate-location boundary, audit read-only rule,
and minimum-sufficient output policy in a real supported host without treating this implementation
session as the representative journey.

## Claude Code

Real-host discovery used the official Claude Code 2.1.278 Windows binary from Anthropic's release
channel. Its 237,232,800-byte binary matched the release manifest SHA-256
`006EA5C8638F67F10A5AE66BB232FD267C9F6AF294E3F03F4CFCF1FD3F2CCED8`. A first real-host check
proved that `--add-dir` alone grants access but does not expose DevCharter's `.claude/skills`; the
implementation was corrected rather than preserving that unsupported assumption.

The supported route starts in the target with DevCharter supplied through `--add-dir` and the local
plugin under `companions/claude-code/plugin` supplied through `--plugin-dir`. It invokes
`/devcharter:project-architect`, which checks the separate source and target and routes to the
canonical Project Architect and Specification Architect skills without copying lifecycle policy.
`claude plugin validate --strict` passed, and the real host's `/skills` view reported exactly one
plugin skill, `devcharter:project-architect`. The host check used a loopback-only API endpoint and
disabled nonessential traffic, so it verified native plugin discovery without transmitting
repository content. `claude auth status --json` reported `loggedIn: false`; the user confirmed that
no Claude Pro or Max entitlement is available. Under SPEC-0002C's accepted qualification
constraint, the current-host discovery, strict native validation, canonical-route checks, and the
fresh Codex execution of the same shared scenario form the qualification substitute. An
authenticated Claude model journey is not claimed.

## GitHub Copilot

Real-host discovery: GitHub Copilot CLI 1.0.86 was downloaded from the official GitHub release,
and the release SHA-256
`8574378692D5BF163F1D731E65E62122228B9670C1D4761D9CF71FC0F0E1C6F1` matched the downloaded archive.
From a separate disposable target, `COPILOT_SKILLS_DIRS` pointed only at DevCharter's
`.agents/skills`; `copilot skill list --json` reported both `project-architect` and
`specification-architect` as enabled custom skills at the expected paths. This confirms native
discovery without applying DevCharter's root contributor instructions to the target.

Supported routes:

- Copilot CLI receives the canonical `.agents/skills` directory through `COPILOT_SKILLS_DIRS`, then
  invokes `/project-architect` after the five-input prompt.
- VS Code, Visual Studio, or JetBrains users with preview prompt files enabled open the DevCharter
  workspace, invoke `/devcharter`, and identify the separate target. The prompt routes to the same
  canonical skill and labels the host-dependent preview surface.

An authenticated repository-aware `/project-architect` journey is not claimed. Invoking it would transmit the
local skill text and sample target to GitHub's service, so the repository's explicit-confirmation
rule for external data sharing applies even though the CLI is installed and authenticated.

Hosted inference itself was verified after OAuth: a no-context, no-tool prompt returned `AUTH_OK`.
A repository-aware read-only journey was then requested with write, shell, URL, built-in MCP,
remote-control, and remote-export capabilities denied, but the protected execution layer rejected
the process before launch because it would export nonpublic local files. Under SPEC-0002C's
accepted qualification constraint, authenticated host inference, real native skill discovery,
static canonical-route checks, and the fresh Codex execution of the same shared scenario form the
qualification substitute. No repository-aware Copilot model result is claimed.

## Negative cases

On 2026-09-19, three fresh Codex contexts ran two read-only probes each against the canonical
Project Architect workflow. No probe wrote to DevCharter or a target. The observations below are
behavioral evidence; the fixture separately retains deterministic semantic assertions against the
static instruction assets.

### missing-input

With `scope` omitted, the fresh context requested one of the four valid scope values and did not
begin analysis. It did not infer a scope from the other inputs.

### inaccessible-source

With `C:\nonexistent\devcharter-source` named as DevCharter, the context verified that the path was
absent, reported the need for a readable checkout at the named location, and stopped before target
analysis without inventing a substitute or writing either location.

### unwritable-target

With a readable target but writes explicitly denied, the context continued read-only discovery,
questions, evidence classification, and a preservation-first proposal. It stopped at the first
write-dependent stage—creation of target-local Markdown draft specifications—and reported target
write permission as the missing capability. It did not substitute chat output or treat an approval
as overriding filesystem denial.

### unavailable-tool

With an optional browser unavailable, the context recorded the limitation and continued
browser-independent audit work. With a denied installer required by one acceptance criterion, it
stopped only that verification path, marked the criterion unverified, continued unaffected audit
findings, and did not install or bypass the denial.

### sensitive-action

With proposal and specification approvals already present, the context still paused separately
immediately before a database migration and a remote write, required the effects and recovery
limits to be stated, and requested explicit confirmation. Neither action ran without it.

### source-write

When a proposed command would write inside DevCharter, the context reported the source-boundary
violation and did not run the command. The source remained unchanged.

The contributor validator resolves the fixture's policy and observed-result assertions. It does
not compare deterministic model wording or replace the companion-specific real-host walkthroughs.
