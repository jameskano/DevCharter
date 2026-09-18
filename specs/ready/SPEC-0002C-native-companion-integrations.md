# SPEC-0002C — Native Companion Integrations

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0002C |
| Parent | SPEC-0002 |
| Status | ready |
| Approval | User requested final ready implementation specifications on 2026-09-18 |
| Dependencies | SPEC-0002A, SPEC-0002B |
| Enables | SPEC-0002D |

## Purpose

Make the shared DevCharter methodology directly usable by Codex, Claude Code, and GitHub Copilot
through each companion's supported native instruction and reuse mechanisms. A user must be able to
give one of these companions the five required inputs and complete the same governed lifecycle
without installing DevCharter in the target or operating a DevCharter CLI.

The integrations translate one canonical methodology into native discovery and invocation paths.
They do not duplicate product truth, create separate lifecycle semantics, or promise identical
language-model output.

## Required user journey

For every supported companion, the user supplies:

1. `new`, `retrofit`, or `audit` mode;
2. `full`, `governance`, `engineering`, or `ai` scope;
3. a local folder or accessible GitHub location for DevCharter;
4. the target project location; and
5. initial context in chat, Markdown specifications, repository files, or a combination.

The companion resolves DevCharter as read-only guidance, keeps it distinct from the target, loads
the native entrypoint, and follows the shared workflow. Missing inputs are requested explicitly.
The user is not required to copy DevCharter assets into the target before discovery, add a
DevCharter dependency, or understand an internal transport protocol.

## Integration architecture

### Canonical shared source

The Project Architect skill and referenced DevCharter knowledge are the canonical behavioral
source. Companion-specific assets should route to that source and contain only the instructions
needed for native discovery, invocation, capability mapping, and output placement.

Provider assets must not fork the definitions of modes, scopes, approvals, safety boundaries,
proposal requirements, specification lifecycle, or completion criteria. Where a companion cannot
consume a shared asset directly, an adapted file may restate the minimum necessary behavior and
must include a conformance check against the canonical source.

### Capability record

Implementation must record, with current official sources:

- the repository and project instruction files each companion discovers;
- reusable skill, prompt, command, agent, plugin, or equivalent mechanisms it supports;
- path-scoped instruction behavior where supported;
- how a user references a separate local or remote DevCharter location;
- relevant limitations by host, IDE, CLI, plan, preview feature, or permission model;
- how target files and commands can be inspected, changed, and verified.

Capabilities that are unavailable or host-dependent must be reported, not simulated through an
invented format.

### Native output policy

DevCharter recommends and creates native target artifacts only when the project needs them. A root
cross-tool instruction file may be shared when companions officially support it and its content is
truly common. Provider-specific files are added only for behaviors the shared file cannot express.

Possible output includes repository instructions, path-specific instructions, stable skills,
prompts, custom agents, hooks, plugins, or MCP configuration. None is mandatory merely because the
companion supports it. Every proposed artifact must name its purpose, ownership, evidence, and
verification.

## Supported integrations

### Codex

Provide a native Codex entrypoint using supported repository instructions and skill discovery.
Codex-specific guidance must correctly route between the Project Architect and Specification
Architect, respect layered instruction scope, and use `.codex/` configuration only when current
official capability and project need justify it.

### Claude Code

Provide a native Claude Code entrypoint using its current project-instruction and reusable-workflow
mechanisms. The integration must explain how Claude reads DevCharter from a separate accessible
location and writes only to the approved target. It must not assume that Codex file names or skill
formats are automatically native to Claude.

### GitHub Copilot

Provide a native GitHub Copilot entrypoint for the supported Copilot environments using current
repository and path-specific instruction mechanisms and, where applicable, supported agent, skill,
prompt, CLI, or plugin facilities. Environment-dependent behavior must be labeled so that a feature
available in one IDE or Copilot CLI is not presented as universal.

### Other companions

Document a generic best-effort route: a capable companion may read the canonical Markdown
instructions directly and follow the workflow. DevCharter makes no support or output-quality claim
for companions outside the three design targets. Generic guidance must not introduce a fourth
provider-specific contract.

## Reasoning and capability guidance

Every entrypoint recommends a strong reasoning model for repository discovery, proposal synthesis,
architecture, and detailed SDD planning. It explains that implementation may use the same model or
a cheaper/faster option when the approved plan is precise, risk is low, and verification is strong.
The recommendation is advisory and provider-neutral.

When a required capability is missing, the companion identifies the affected task and consequence.
It continues with safe independent work for non-blocking limitations and stops at the affected gate
for blocking limitations. A technically available capability does not waive explicit confirmation
for destructive actions, secret access, external data sharing, remote writes, migrations, or other
hard-to-reverse effects.

## Implementation tasks

### C1. Verify current companion capabilities

Research official documentation, record dated sources and limitations, and choose the smallest
native surface for each companion.

### C2. Define shared invocation and conformance

Create a common five-input invocation contract, expected stage outputs, approval gates, error
behavior, and a conformance matrix that native integrations must satisfy.

### C3. Implement the Codex integration

Create or adapt Codex-native instructions and skills, with routing and example invocations.

### C4. Implement the Claude Code integration

Create the minimum Claude-native project instructions and reusable workflow entrypoint, with
separate-location guidance and examples.

### C5. Implement the GitHub Copilot integration

Create the minimum Copilot-native instruction and workflow assets for explicitly supported Copilot
hosts, with environment limitations and examples.

### C6. Add fallback and integration verification

Document best-effort direct Markdown use and add static and scenario checks for discovery,
references, routing, native placement, and semantic consistency.

## Acceptance criteria

1. Codex, Claude Code, and GitHub Copilot each have a documented native entrypoint.
2. Each entrypoint collects or verifies all five required inputs before analysis.
3. Each integration treats DevCharter as read-only guidance and the target as a separate explicit
   location.
4. No supported journey requires a DevCharter CLI, target-local DevCharter package, JSON protocol,
   or hosted DevCharter service.
5. All integrations route to one canonical lifecycle with the same proposal and specification
   approval gates.
6. Provider-specific files contain only native adaptation and do not create conflicting product
   truth.
7. Current official sources and dated capability limitations are recorded for every supported
   companion.
8. Companion-native artifacts generated for a target are individually justified rather than
   emitted as a fixed bundle.
9. Supported-host differences are explicit; unavailable capabilities are not silently assumed.
10. Blocking and non-blocking capability failures produce the behavior defined by SPEC-0002.
11. Sensitive actions require explicit confirmation regardless of host permission.
12. Every entrypoint contains consistent strong-reasoning guidance for proposal and planning.
13. Other companions have a clearly labeled best-effort route without a support guarantee.
14. Tests validate DevCharter-owned assets, references, routing, and representative journeys; they
    do not assert deterministic equality of model output.
15. Native assets contain no stale CLI, runtime, package-installation, or lifecycle-JSON guidance.

## Verification

- static checks for required files, metadata, links, references, and native path conventions;
- a semantic conformance matrix covering inputs, stages, approvals, safety, outputs, and failures;
- fresh-context walkthroughs for all three supported companions;
- at least one documented representative journey in a real supported host for each companion,
  using manual evidence where stable automation is unavailable;
- negative tests for a missing input, inaccessible DevCharter source, unwritable target, unavailable
  tool, attempted sensitive action, and attempted write to DevCharter itself;
- review that shared behavior has one source and companion adapters add no contradictory policy.

## Documentation impact

Update the main README and user guide with the five-input invocation, setup paths, native examples,
capability limitations, model guidance, and best-effort fallback. Keep detailed capability research
in dated references that can be refreshed without redefining the product lifecycle.

## Completion gate

Do not mark SPEC-0002C `done` until every first-class companion has a discoverable native route,
passes the shared conformance matrix and representative journey, cites current official capability
evidence, and has no unresolved contradiction with the canonical methodology. Real-host gaps must
be reported as limitations rather than hidden by static tests.
