# SPEC-0002C — Native Companion Integrations

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0002C |
| Parent | SPEC-0002 |
| Status | done |
| Approval | User explicitly activated implementation and approved the documented host-qualification exception on 2026-09-19 |
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

## Accepted qualification constraint

On 2026-09-19, the user confirmed that no Claude Pro or Max entitlement is available and explicitly
authorized completing SPEC-0002C with the strongest non-destructive evidence available, including a
requirements adjustment when authenticated Claude Code execution is impossible. The protected
execution environment also denies sending nonpublic local DevCharter and target contents to
Copilot without a more narrowly enumerated data-egress authorization. These are qualification
environment limits, not reasons to simulate provider output or weaken the native integration
contract. The substitute below therefore proves native discovery, adapter validity, canonical
semantics, and observed shared-workflow behavior while preserving an explicit record that no Claude
model journey and no repository-aware Copilot model journey occurred.

## Verification

- static checks for required files, metadata, links, references, and native path conventions;
- a semantic conformance matrix covering inputs, stages, approvals, safety, outputs, and failures;
- fresh-context route walkthroughs for all three supported companions, using real-host model
  execution when the required account and data-sharing capability are available;
- at least one documented representative model journey in a real supported host for every
  authenticated companion allowed to receive the required local context;
- when hosted inference is unavailable because of account/plan limits or an enforced data-egress
  policy, a documented qualification substitute consisting of real current-host discovery and
  version evidence, native validation when the host provides it, static canonical-route and
  conformance checks, the same scenario behavior exercised through the canonical methodology in an
  available supported host, and the exact unavailability reason; this qualifies the integration
  route without claiming model-output evidence for the unavailable host;
- negative tests for a missing input, inaccessible DevCharter source, unwritable target, unavailable
  tool, attempted sensitive action, and attempted write to DevCharter itself;
- review that shared behavior has one source and companion adapters add no contradictory policy.

## Documentation impact

Update the main README and user guide with the five-input invocation, setup paths, native examples,
capability limitations, model guidance, and best-effort fallback. Keep detailed capability research
in dated references that can be refreshed without redefining the product lifecycle.

## Completion gate

Do not mark SPEC-0002C `done` until every first-class companion has a discoverable native route,
passes the shared conformance matrix and either its representative model journey or the documented
qualification substitute above, cites current official capability evidence, and has no unresolved
contradiction with the canonical methodology. Unavailable hosted inference must remain an explicit
limitation rather than being represented as model-output evidence.

## Implementation evidence

### Acceptance mapping

| Criteria | Evidence |
|---|---|
| 1-3 | The three `companions/*/README.md` files document native setup, all five inputs, separate named locations, and the read-only DevCharter boundary. |
| 4-6 | Each entrypoint routes to the canonical Project Architect and Specification Architect skills, preserves both approval gates, rejects removed runtime surfaces, and keeps provider files limited to discovery and capability adaptation. |
| 7 | `references/official-*-capabilities.md` records official sources, a 2026-09-19 verification date, native instruction/skill surfaces, separate-location access, permissions, and host limitations for all three companions. |
| 8-9 | The shared integration contract requires individual purpose, ownership, evidence, and verification for target artifacts; provider entrypoints distinguish CLI, IDE, preview, plan, version, policy, and remote limitations. |
| 10-11 | The contract and six negative fixtures cover blocking/non-blocking capability failures, inaccessible source, unwritable target, unavailable tools, source-write attempts, and immediate sensitive-action confirmation; three fresh Codex contexts exercised all six cases without writes. |
| 12 | Every entrypoint contains the same provider-neutral strong-reasoning recommendation and bounded lower-cost implementation option. |
| 13 | The README and user guide define direct Markdown use by other capable companions as best effort without a support or quality guarantee. |
| 14 | `tests/fixtures/companion-integration-scenarios.json`, the walkthrough record, and the contributor validator resolve both policy and observed-result assertions for native assets, dated references, routing, three representative routes, and six fresh-context negative probes without comparing model wording. |
| 15 | The validator scans current instructions, adapters, capability records, and walkthroughs for obsolete CLI/runtime patterns; no native asset requires package installation, lifecycle JSON, fingerprints, or a hosted service. |

### Verification results

- `npm run verify` passed with a process-local Node v24.18.0: 47 Markdown files, 11 specifications,
  two canonical skills, ten methodology scenarios, six companion failure scenarios, and the
  separate-location and hostile-audit walkthroughs.
- `git diff --check` passed.
- A fresh Codex context completed a read-only `audit` / `ai` journey against a separate disposable
  target. Before and after snapshots contained the same sole 149-byte `README.md` with SHA-256
  `07CF994190BF1989B8591EC5316E83BFD664709C280719C9203B39BA03643C6F`. The audit preserved it and
  rejected unjustified AI artifacts, exercising the native route and minimum-sufficient policy.
- GitHub Copilot CLI 1.0.86 discovered both canonical skills from `COPILOT_SKILLS_DIRS` while its
  working directory was a separate disposable target. The downloaded official release archive
  matched SHA-256 `8574378692D5BF163F1D731E65E62122228B9670C1D4761D9CF71FC0F0E1C6F1`.
- GitHub OAuth completed and a no-context, no-tool hosted prompt returned `AUTH_OK`, proving current
  inference access. The protected execution layer rejected the repository-aware prompt before
  process launch because it would export nonpublic local files. Copilot therefore uses the accepted
  qualification substitute: authenticated host access, real native discovery, static canonical
  conformance, and the shared scenario executed in a fresh Codex host. No repository-aware Copilot
  model result is claimed.
- The official Claude Code 2.1.278 binary matched its release-manifest SHA-256, strict plugin
  validation passed, and `/skills` discovered `devcharter:project-architect` from the local plugin
  while running in a separate disposable target. A loopback API endpoint prevented external data
  transmission during this discovery check. Claude reported `loggedIn: false`, and the user
  confirmed that no Pro or Max entitlement is available. Claude therefore uses the accepted
  qualification substitute: current-host discovery, strict native validation, static canonical
  conformance, and the shared scenario executed in a fresh Codex host. No Claude model result is
  claimed.
- Three additional fresh Codex contexts exercised the six required negative cases: missing input,
  inaccessible source, unwritable target, optional versus required unavailable tooling, sensitive
  migration and remote-write confirmation, and an attempted DevCharter-source write. Each context
  produced the contract-defined stop/continue decision and made no writes; the walkthrough records
  the observed behavior and the fixture links each case to both policy and result evidence.
- The default `npm run verify` attempt used the host's Node v20.19.0 and failed before the script ran
  because the sandbox denied an ancestor-path `lstat`; direct execution with the available declared
  Node 24 runtime passed. This is an environment failure, not hidden test success.
- The Skill Creator Python quick validator could not run because Python is unavailable to the
  sandbox. The repository validator independently checked the Claude plugin manifest, adapter
  frontmatter, name, description, canonical route, links, and stale-guidance boundaries; Claude
  Code's own strict plugin validator also passed.
- The first npm-based Copilot lookup could not verify the environment's registry TLS certificate
  chain, so certificate checking remained enabled and the checksum-verified official release was
  used instead.
- A fresh independent completion review read the refined specification before the diff, reran the
  supported Node 24 verification and `git diff --check`, inspected every modified and untracked
  file, mapped AC1-15, found no blocking or important issue, and returned `VERDICT: PASS`.

### Documentation review and qualification limits

Updated `README.md`, `MANIFEST.md`, `CHANGELOG.md`, `docs/user-guide.md`, the product purpose, system
overview, v0 migration map, specification index, companion entrypoints, and capability records.
Reviewed `AGENTS.md`, the quality/decision model, spec-driven workflow, shared skills, knowledge,
templates, and historical release records without changes: their shared authority remains current,
and historical records remain explicitly labelled.

Implementation and qualification are complete under the accepted constraint without adding role
agents, hooks, MCP, a runtime, target-local DevCharter assets, or plugins beyond the one minimal
Claude-native adapter required by current host behavior. The walkthrough preserves the unavailable
Claude and repository-aware Copilot model journeys as explicit limits rather than presenting
discovery or substitute evidence as provider model output.
