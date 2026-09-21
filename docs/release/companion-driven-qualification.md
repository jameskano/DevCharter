# Companion-driven DevCharter qualification

## Status

Qualification completed under SPEC-0002D. Static and scripted evidence plus representative
Codex and authenticated GitHub Copilot audit journeys pass. Claude Code was installed and its
authentication flow was attempted, but the user-approved missing subscription entitlement prevents
that host journey. On 2026-09-21 the user explicitly deferred live new/full, new/ai, retrofit/full,
and retrofit/ai target execution until later user testing; the validated scenario contracts are the
required SPEC-0002D evidence and do not claim those targets were implemented.

Qualification opened on 2026-09-19; evidence last updated on 2026-09-21. DevCharter location:
`C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/DevCharter`. Qualification targets are distinct
temporary directories created by the contributor harness. Sensitive values and private transcripts
are intentionally excluded.

## Evidence inventory

- `npm run verify` validates static structure, native routes, all required fixtures, explicit
  criterion IDs, source/target isolation, and hostile audit snapshot equality.
- [`release-qualification-scenarios.json`](../../tests/fixtures/release-qualification-scenarios.json)
  defines the five inputs, starting state, approval order, expected effects, preserved paths, and
  prohibited effects for ten representative journeys.
- [`release-qualification-results.md`](../../tests/scenarios/release-qualification-results.md)
  records scripted walkthrough outcomes without comparing model prose byte-for-byte.
- [`project-architect-walkthrough-results.md`](../../tests/scenarios/project-architect-walkthrough-results.md)
  and [`companion-integration-walkthrough-results.md`](../../tests/scenarios/companion-integration-walkthrough-results.md)
  retain the completed methodology and native-adapter evidence from SPEC-0002B and SPEC-0002C.
- [`v0-migration-map.md`](../architecture/v0-migration-map.md) records every removed, migrated,
  adapted, or historical v0 surface.

## Real-host qualification attempts

Each supported host must have representative evidence or an explicit release-blocking failure.
Static adapter conformance does not substitute for host use.

### Codex

- Host: Codex CLI on Windows, `codex-cli 0.154.0-alpha.6.2`, from the OpenAI ChatGPT/Codex VS Code
  extension `26.908.40401`; journey run on 2026-09-20.
- Route: repository `AGENTS.md` plus `.agents/skills/project-architect/SKILL.md`; DevCharter is the
  primary workspace and the target is a separately writable location.
- Five inputs: `audit`, `full`, this DevCharter checkout, separate target
  `C:/Users/iajer/AppData/Local/Temp/devcharter-codex-audit-target`, and an instruction to treat all
  package scripts as hostile and return findings without secret reads, commands, writes, installs,
  report files, or external effects.
- Stages: input/discovery and audit findings exercised. Proposal, SDD approval, and implementation
  were correctly not applicable. No material question was needed because the audit boundary was
  complete; intended product behavior and provenance remained limitations.
- Static procedure: `Get-Item`, recursive `Get-ChildItem`, and `Get-Content` for README,
  `package.json`, and `src/index.js`; `.env.example` was recognized by name/metadata only. Sorted
  path metadata and safe-file SHA-256 hashes were identical before and after. `codex --version` was
  the only spawned process.
- Actual findings: hostile `postinstall` and `test` scripts could create marker files; docs were
  stale; ESM configuration was ambiguous; no lockfile, package-manager authority, genuine test,
  format/lint/type/build/run harness, CI, AI instructions, or Git metadata was present.
- Effects: no changed paths. `.env.example`, `package.json`, `README.md`, `src/`, and `src/index.js`
  were preserved; all DevCharter paths were preserved; no script marker, dependency, lockfile,
  cache, report, Git metadata, target-local state, network operation, or external effect occurred.
- Limitation: runtime behavior, secret-like contents, history, ownership, provenance, and environment
  requirements were intentionally unverified under the no-write/no-secret boundary.
- State: pass for the representative Codex route and audit journey; it does not substitute for the
  approved Claude entitlement limitation or the explicitly deferred new/retrofit user validation.

### Claude Code

- Host: Claude Code `2.1.268` installed from the verified `Anthropic.ClaudeCode` WinGet package on
  Windows, 2026-09-20. The earlier npm path stalled without producing packages and was abandoned.
- Authentication check: `claude auth status` returned `loggedIn: false`, `authMethod: none`.
- Real-host attempt: `claude auth login --claudeai` opened the official OAuth flow and remained
  pending until it was cancelled after repeated bounded polls. The user confirmed that the account
  has no Pro or Max entitlement and therefore cannot use Claude Code.
- Static evidence: the minimal local plugin, native skill metadata, `--add-dir`/`--plugin-dir`
  setup, canonical routing, and failure policy pass repository checks.
- Approved limitation: on 2026-09-20 the user explicitly authorized continuing qualification
  without a Claude journey because the required subscription tier is unavailable. This is recorded
  as an attempted real-host entitlement failure, not a successful or equivalent journey. No
  lifecycle output is claimed from installation or the failed OAuth attempt.

### GitHub Copilot

- Host: GitHub Copilot CLI `1.0.86` installed from the verified `GitHub.Copilot` WinGet package on
  Windows, 2026-09-20; its PowerShell dependency was installed by WinGet.
- Authentication: OAuth device flow completed as `jameskano`. The user explicitly approved sending
  the six named DevCharter instruction/knowledge files and the non-secret fixture to GitHub for this
  qualification run.
- Static evidence: the CLI skill route, IDE prompt route, dated capability record, canonical
  routing, and failure policy pass repository checks.
- Five inputs: `audit`, `full`, a temporary DevCharter bundle containing only the approved files, a
  separate isolated JavaScript target, and instructions to treat scripts as hostile, exclude
  `.env.example` contents, avoid commands/writes/installs/external effects, and return findings.
- Restrictions: built-in MCP, remote control/export, shell, write, and URL tools were disabled or
  denied. The target was the working directory and only the approved bundle was added for reading.
- Stages: input validation and audit findings exercised; no question was necessary because the
  audit boundary was complete. Proposal, approval, SDD, and implementation were correctly not
  applicable.
- Actual result: Copilot inspected the shared skill/foundation/contract/entrypoint and three safe
  target files; it excluded `.env.example` contents, identified both marker-producing scripts,
  missing engineering/governance foundations, stale docs, and ambiguous module configuration, and
  accurately reported runtime, Git, dependency, and secret-handling limitations.
- Effects: no target path changed. Independent pre/post inventories and SHA-256 hashes of safe files
  were identical; no script marker, report, dependency, lockfile, cache, Git state, command, URL,
  remote operation, or MCP action occurred.
- State: pass for the representative Copilot route and read-only audit journey.

Official capability sources were rechecked on 2026-09-19: [Codex skills](https://developers.openai.com/codex/skills),
[Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md), [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code/cli-usage),
[Claude Code plugins](https://docs.anthropic.com/en/docs/claude-code/plugins), [Copilot CLI skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills),
and [Copilot CLI reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference).
Provider behavior remains time-sensitive; the dated records under `references/` are evidence rather
than product authority.

## Local verification results

Environment: Windows, Node v24.18.0 selected explicitly because the workstation default Node
v20.19.0 is below the repository's declared `>=22` engine.

| Command | Result | Actual evidence |
|---|---|---|
| `npm run verify` | Pass | 50 Markdown files, 11 specifications, 2 canonical skills, 10 methodology scenarios, 6 companion-failure scenarios, 10 release scenarios, and both temporary walkthroughs passed. |
| `npm test` | Pass | Invoked the same dependency-free static and scenario qualification on Node v24.18.0. |
| `npm run format:check` | Pass | Invoked the same whitespace, reference, metadata, fixture, and scenario checks on Node v24.18.0. |
| `git diff --check` | Pass | No output. |
| Default-runtime attempt | Skipped as unsupported | Node v20.19.0 is below the declared engine; no compatibility claim is made. |

No dependency installation, build, lint, or type-check command applies to this static repository.
The root manifest has no dependencies, executable, exports, or workspaces.

## Acceptance-criterion matrix

State values are `pass`, `pending`, or `blocked`. A row cites actual repository or host evidence or
an explicit approved limitation/deferral; none is satisfied by assertion alone.

### SPEC-0002 parent

| Criterion | State | Evidence |
|---|---|---|
| SPEC-0002-AC-01 | pass | Project Architect input validation and release fixtures preserve exactly three modes. |
| SPEC-0002-AC-02 | pass | Input validation and fixtures preserve exactly four scopes. |
| SPEC-0002-AC-03 | pass | Skill and focused-scope walkthroughs warn but never substitute mode or scope. |
| SPEC-0002-AC-04 | pass | README, user guide, and lifecycle scenarios enforce proposal then Markdown-spec approval. |
| SPEC-0002-AC-05 | pass | Codex and Copilot host routes pass; Claude native assets pass statically with an approved entitlement failure. |
| SPEC-0002-AC-06 | pass | Dated capability records and failure scenarios report unsupported host behavior. |
| SPEC-0002-AC-07 | pass | All three entrypoints contain provider-neutral reasoning guidance. |
| SPEC-0002-AC-08 | pass | Separate-location fixture and root docs keep source independent of target dependencies. |
| SPEC-0002-AC-09 | pass | Source snapshots in hostile audit and separate-location walkthrough detect source writes. |
| SPEC-0002-AC-10 | pass | The full-new fixture and walkthrough specify the justified runnable foundation, AI ecosystem, harnesses, and expected target paths; live execution is explicitly deferred. |
| SPEC-0002-AC-11 | pass | Browser-open is traced from the request through proposal, detailed-plan expectation, configuration effect, and practical launch verification design. |
| SPEC-0002-AC-12 | pass | The scenario permits framework-generated structure only after stack justification and separate specification approval. |
| SPEC-0002-AC-13 | pass | Expected and prohibited effects exclude substantive product features from the foundation scenario. |
| SPEC-0002-AC-14 | pass | Retrofit fixtures require preservation and allow the AI/harness additions only after evidence and bounded approvals; live execution is explicitly deferred. |
| SPEC-0002-AC-15 | pass | Hostile audit snapshot and inert-script assertions prove no target mutation. |
| SPEC-0002-AC-16 | pass | One- and multi-spec scenarios treat proposal approval as planning authority only. |
| SPEC-0002-AC-17 | pass | Specification approval is bounded by behavior, scope, risks, and criteria. |
| SPEC-0002-AC-18 | pass | Material-deviation scenario stops, revises, and reapproves affected work. |
| SPEC-0002-AC-19 | pass | Capability scenario distinguishes optional continuation from blocking permission denial. |
| SPEC-0002-AC-20 | pass | Instructions forbid session protocols, credentials, transcripts, and hidden reasoning. |
| SPEC-0002-AC-21 | pass | Integration contract routes all adapters to canonical shared skills; validator resolves routes. |
| SPEC-0002-AC-22 | pass | README and user guide label other companions best effort and unqualified. |
| SPEC-0002-AC-23 | pass | Skills and scenarios require actual target command results after any implementation and explicitly avoid fabricating results when live execution is deferred. |
| SPEC-0002-AC-24 | pass | Recovery and capability scenarios preserve unrelated/partial work and prohibit false completion. |
| SPEC-0002-AC-25 | pass | Remote limitations are explicit; read-only hosts cannot claim application capability. |
| SPEC-0002-AC-26 | pass | Package inventory and validator prove the v0 runtime, CLI, and JSON lifecycle are absent. |
| SPEC-0002-AC-27 | pass | Current product, architecture, engineering, user, contributor, and release docs match implemented active behavior. |

### SPEC-0002A

| Criterion | State | Evidence |
|---|---|---|
| SPEC-0002A-AC-01 | pass | No product executable or user-facing CLI command exists. |
| SPEC-0002A-AC-02 | pass | Validator rejects all three removed package directories. |
| SPEC-0002A-AC-03 | pass | Current-source stale-instruction scan rejects the former lifecycle. |
| SPEC-0002A-AC-04 | pass | README and separate-location fixture support local or GitHub source locations. |
| SPEC-0002A-AC-05 | pass | README names the five inputs and next skill/entrypoint. |
| SPEC-0002A-AC-06 | pass | Manifest separates methodology, adapters, knowledge, templates, tests, docs, and history. |
| SPEC-0002A-AC-07 | pass | v0 migration map classifies retained knowledge and removal. |
| SPEC-0002A-AC-08 | pass | Historical specs and release records remain linked and bannered. |
| SPEC-0002A-AC-09 | pass | Private dependency-free package manifest exposes checks only. |
| SPEC-0002A-AC-10 | pass | Validator resolves Markdown links, spec relationships, IDs, and status paths. |
| SPEC-0002A-AC-11 | pass | Repository inventory contains no empty catalog scaffolds. |
| SPEC-0002A-AC-12 | pass | Whitespace, generated-output, secret, and integrity checks are part of `npm run verify`. |

### SPEC-0002B

| Criterion | State | Evidence |
|---|---|---|
| SPEC-0002B-AC-01 | pass | Project Architect requires all five inputs before substantive analysis. |
| SPEC-0002B-AC-02 | pass | Mode/scope tables and focused scenarios encode distinct positive and negative behavior. |
| SPEC-0002B-AC-03 | pass | Discovery instructions inspect target authority and provenance before questions. |
| SPEC-0002B-AC-04 | pass | Question guidance separates facts, inferences, assumptions, decisions, and risks. |
| SPEC-0002B-AC-05 | pass | Full new scenario covers complete foundation plus explicit non-default configuration. |
| SPEC-0002B-AC-06 | pass | Retrofit scenarios preserve established content and reject unjustified replacement. |
| SPEC-0002B-AC-07 | pass | Hostile audit walkthrough hashes before/after state and never executes target code. |
| SPEC-0002B-AC-08 | pass | Proposal contract requires component decisions, evidence, ownership, and rejections. |
| SPEC-0002B-AC-09 | pass | Proposal approval routes only to Specification Architect planning. |
| SPEC-0002B-AC-10 | pass | One- and multi-spec fixtures enforce separate approval before active implementation. |
| SPEC-0002B-AC-11 | pass | Failure scenario stops affected work and continues only safe independent work. |
| SPEC-0002B-AC-12 | pass | Sensitive scenario requires immediate per-action reconfirmation. |
| SPEC-0002B-AC-13 | pass | Component-selection knowledge requires evidence and minimum sufficiency. |
| SPEC-0002B-AC-14 | pass | Stack and harness knowledge require maintained sources and executable evidence. |
| SPEC-0002B-AC-15 | pass | Recipes and implementation template are optional and contain no fake versions or secrets. |
| SPEC-0002B-AC-16 | pass | Methodology fixture covers all required scenario families and recovery. |
| SPEC-0002B-AC-17 | pass | Current-source scanning rejects removed runtime/CLI instructions. |
| SPEC-0002B-AC-18 | pass | Skills, docs, manifest, templates, and migration map share lifecycle authority. |

### SPEC-0002C

| Criterion | State | Evidence |
|---|---|---|
| SPEC-0002C-AC-01 | pass | Codex entrypoint documents discovery, five inputs, and separate locations. |
| SPEC-0002C-AC-02 | pass | Claude plugin and entrypoint document native setup and canonical routing. |
| SPEC-0002C-AC-03 | pass | Copilot CLI/IDE entrypoint documents native setup and host differences. |
| SPEC-0002C-AC-04 | pass | Every adapter routes to shared Project and Specification Architect skills. |
| SPEC-0002C-AC-05 | pass | Native routes preserve the two approval gates and sensitive confirmation. |
| SPEC-0002C-AC-06 | pass | Provider files adapt discovery only and do not duplicate lifecycle authority. |
| SPEC-0002C-AC-07 | pass | Three dated official capability records resolve and name official sources. |
| SPEC-0002C-AC-08 | pass | Integration contract requires purpose, ownership, evidence, and verification. |
| SPEC-0002C-AC-09 | pass | Entrypoints distinguish CLI, IDE, preview, remote, permission, and policy limits. |
| SPEC-0002C-AC-10 | pass | Six negative fixtures cover blocking and non-blocking capability failures. |
| SPEC-0002C-AC-11 | pass | Source-write and sensitive-action probes preserve source and require confirmation. |
| SPEC-0002C-AC-12 | pass | Model guidance is provider-neutral and bounded by risk and verification. |
| SPEC-0002C-AC-13 | pass | Generic route is expressly best effort without quality guarantee. |
| SPEC-0002C-AC-14 | pass | Adapter, reference, route, and negative-scenario assertions avoid prose equality. |
| SPEC-0002C-AC-15 | pass | Current routes contain no package install, JSON lifecycle, fingerprint, or service dependency. |

### SPEC-0002D

| Criterion | State | Evidence |
|---|---|---|
| SPEC-0002D-AC-01 | pass | README leads with companion use, five inputs, native routes, gates, limitations, and first run. |
| SPEC-0002D-AC-02 | pass | User guide covers new, retrofit, and audit from inputs to correct final stage. |
| SPEC-0002D-AC-03 | pass | Full-new scenario evidence specifies the complete foundation, expected inventory, browser-open effect, and practical verification design; live execution is deferred. |
| SPEC-0002D-AC-04 | pass | Focused new/ai and retrofit/ai fixtures constrain authorized effects and enumerate unrelated prohibited effects; live execution is deferred. |
| SPEC-0002D-AC-05 | pass | Retrofit fixtures and walkthroughs require preservation and separately approved, justified additions without claiming that the deferred target was changed. |
| SPEC-0002D-AC-06 | pass | Hostile audit compares source/target snapshots and prohibits all named mutations. |
| SPEC-0002D-AC-07 | pass | Single- and multi-spec fixtures encode separate gates and deviation reapproval. |
| SPEC-0002D-AC-08 | pass | Capability and sensitive fixtures cover blocking, optional, and five sensitive effects. |
| SPEC-0002D-AC-09 | pass | Codex and Copilot host journeys pass; Claude has an attempted, explicitly approved entitlement failure. |
| SPEC-0002D-AC-10 | pass | Scenario rubric evaluates decisions/effects and disclaims deterministic parity. |
| SPEC-0002D-AC-11 | pass | Distinct fixture locations and source snapshots detect attempted source writes. |
| SPEC-0002D-AC-12 | pass | Inventory and stale checks reject operational runtime/CLI/JSON/install surfaces. |
| SPEC-0002D-AC-13 | pass | SPEC-0001 and A–E remain accessible with historical banners and index labels. |
| SPEC-0002D-AC-14 | pass | Current product, architecture, workflow, user, contributor, manifest, and index agree. |
| SPEC-0002D-AC-15 | pass | Link/spec relationship checks pass and canonical skills own lifecycle behavior. |
| SPEC-0002D-AC-16 | pass | Validator requires all consumed files and repository inventory has no placeholders. |
| SPEC-0002D-AC-17 | pass | This matrix covers all 90 criteria with explicit states; validator checks unique rows and evidence format. |
| SPEC-0002D-AC-18 | pass | Verify, test, format check, and diff check pass on Node 24; default Node and host blockers are recorded. |

## Migration and compatibility

SPEC-0002 replaces the v0 runtime product completely. The TypeScript packages, executable, JSON
lifecycle, deterministic renderer/writer, fingerprints, managed receipts, tarball qualification,
and target-local installation were removed. Their reusable discovery, authority, preservation,
approval, safety, and verification knowledge moved into shared skills, knowledge, templates, and
scenarios. Command compatibility is intentionally absent because retaining it would restore the
superseded product boundary. SPEC-0001, SPEC-0001A–E, and the v0 release records remain historical
evidence only; they do not define current operation.

## Release decision

### Prior fresh-context completion review

An independent read-only reviewer started without conversation context on 2026-09-21 and returned
`FAIL` against the pre-refinement specification. It confirmed that local verification passed and
that the Claude entitlement limitation was properly recorded, but identified the following then-
unresolved completion blockers:

- no implemented new/full target or observable browser-open proof;
- no target inventories for the focused new/ai and retrofit/ai journeys;
- no applied retrofit/full additions or before/after preservation evidence;
- the resulting pending SPEC-0002 AC10–14 and AC23 and SPEC-0002D AC3–5 rows.

The review did not authorize changes or treat scripted policy walkthroughs as substitutes for the
then-required target effects. The user subsequently changed that requirement explicitly; this
historical failure is retained rather than rewritten as a pass.

### Final fresh-context completion review

A different independent read-only reviewer started without conversation context on 2026-09-21 and
returned `PASS` against the refined parent and SPEC-0002D contracts. It found no unresolved material
issue, confirmed all 90 evidence rows pass, confirmed that the four deferred scenarios do not claim
target implementation, directly ran the validator on Node v24.18.0, and reported that
`active -> done` was justified.

### Final decision

SPEC-0002D is complete. The matrix has no `pending` or `blocked` row, required local commands pass,
the supported-host attempts and approved Claude limitation are recorded, and the fresh-context
review passed. The four temporary target specifications were removed without implementation. Their
live execution remains an explicitly approved post-specification user validation activity, not
claimed completion evidence.
