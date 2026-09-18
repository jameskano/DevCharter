# SPEC-0002 — Companion-Driven DevCharter

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0002 |
| Title | Companion-Driven DevCharter |
| Type | Authoritative parent product and architecture specification |
| Status | ready |
| Draft authorized | User, 2026-09-18 |
| Approval | User explicitly approved the final ready specification direction on 2026-09-18 |
| Relationship | Supersedes SPEC-0001 as product authority; SPEC-0001 and SPEC-0001A–E remain historical implementation evidence |
| Preserved contracts | Modes, scopes, statuses, audit read-only behavior, proposal-before-write, explicit approval, path safety, preservation, validation, and minimum-sufficient generation |

## Authority and transition

SPEC-0002 is the current product and architecture authority for the companion-driven design.
SPEC-0001 and completed SPEC-0001A–E remain historical evidence of the superseded v0 implementation.
Compatible concepts may be reused only when they serve this specification; their former public and
runtime contracts are not preserved automatically.

Approval of this parent does not make any implementation specification `active`. Implementation
begins only when one ready SPEC-0002 child is explicitly moved to `active`.

## Problem

DevCharter v0 exposes its internal lifecycle to the user. A user must install three target-local
packages, invoke several CLI commands, create JSON decision and approval files, copy fingerprints,
and move proposal artifacts between commands. That workflow proves the deterministic core, but it
is not the intended product experience for someone working with an AI coding companion.

The desired user already works in Codex, Claude Code, or GitHub Copilot. They should select a
DevCharter mode and scope, provide an initial brief, answer material questions, review a proposal,
review the exact implementation plan, and approve writes. The companion should perform the
remaining orchestration through DevCharter's safe contracts.

The v0 deterministic renderer is also too narrow for a complete new-project foundation. It can
render a small set of known artifacts, but it cannot safely coordinate a framework initializer,
tool-specific configuration, an initial repository structure, project-specific documentation, or
the verification harnesses needed to make the repository ready for AI-assisted development.

## Desired outcome

A user gives an AI coding companion five inputs: the selected mode, selected scope, DevCharter
location, target-project location, and initial context in plain text or specification files. The
companion reads DevCharter from its local folder or GitHub repository, works against the separately
located target, and completes the guided journey without asking the user to operate DevCharter CLI
commands or manually manage lifecycle JSON.

For `new`, the approved result is a complete, runnable, ready-to-code project foundation and
AI-development ecosystem appropriate to the selected technologies and requested configuration. For
`retrofit`, the approved result preserves the established project while adding or improving the
minimum justified AI ecosystem and critical engineering harnesses. `audit` remains strictly
read-only with respect to the target repository.

Proposal and implementation size are determined by justified need. Minimum-sufficient means that
every component must earn its place; it does not impose an arbitrary limit on file count,
complexity, or framework-generated structure.

## Accepted product decisions

1. The public modes remain exactly `new`, `retrofit`, and `audit`.
2. The public scopes remain exactly `full`, `governance`, `engineering`, and `ai`.
3. The user explicitly selects both mode and scope. DevCharter may warn that repository evidence
   suggests another mode or scope, but it must not silently substitute one.
4. Codex, Claude Code, and GitHub Copilot are required first-class companion integrations.
5. The AI companion is the user interface. The DevCharter CLI and all three v0 runtime packages are
   removed; there is no retained product runtime, machine protocol, JSON lifecycle, deterministic
   renderer, or DevCharter writer.
6. The user may provide initial context through chat, one or more Markdown files, existing
   repository content, or a combination of these.
7. The companion asks only material questions that cannot be answered safely from repository
   evidence or accepted input.
8. The user reviews and explicitly approves an abstract proposal before detailed planning begins.
9. After proposal approval, the companion creates the definitive detailed implementation plan using
   specification-driven development. The user reviews and explicitly approves that specification
   before implementation begins.
10. A strong reasoning model is recommended for discovery synthesis, proposal formation,
    architecture, and planning. It is recommended but optional for implementation, depending on
    risk and complexity. DevCharter remains provider- and model-neutral and does not route models.
11. The proposal and implementation may be as large or small as necessary. Every artifact, tool,
    command, dependency, and configuration change still requires evidence or an accepted decision. The final proposal and implementation should not be over engineered.
12. Initial distribution may require cloning the DevCharter repository or allowing a capable
    companion to access it from GitHub. Registry packages, a standalone executable, and marketplace
    distribution are deferred improvements rather than initial blockers.
13. Initial remote support means a companion may check out or access DevCharter and the target
    repository in its own local or cloud workspace. SPEC-0002 does not introduce a hosted
    DevCharter service or require uploading a local repository to DevCharter.
14. DevCharter's own source checkout is a read-only tool dependency during a target run. The
    companion applies approved changes only to the explicit target root and authorized external
    effects.
15. The target location is chosen by the user or created by the companion at the user's requested
    location. DevCharter does not impose a workspace layout or require its source and target to
    share a parent directory.
16. Human and AI-authored proposals, specifications, plans, and durable project knowledge use
    Markdown. SPEC-0002 introduces no JSON protocol or DevCharter machine-state format.
17. Conversation state belongs to the selected companion. After proposal approval, one or more
    Markdown draft specifications in the target carry the durable detailed plan; DevCharter creates
    no session database, transcript, proposal store, or managed receipt.
18. A `new` run may establish the complete initial technical structure and all justified
    AI-development foundations. It does not implement unrelated product features merely because a
    companion can write code.
19. A `retrofit` run focuses on the AI ecosystem and on important engineering foundations whose
    absence materially weakens AI-assisted development. Tools such as a formatter, linter, type
    checker, tests, or verification command may be installed or configured only when justified and
    explicitly approved in the proposal.
20. The three named companions are the supported design targets because DevCharter tailors native
    files, folders, instructions, and harnesses to them. Other capable companions or models may use
    DevCharter on a best-effort basis, but DevCharter does not guarantee the quality of a model's
    reasoning or implementation.
21. Supported-companion claims concern the correctness and availability of DevCharter guidance and
    native assets, not deterministic equality of model output. Users remain responsible for choosing
    a sufficiently capable model and enabling the tools needed for the requested work.

## Product boundary

DevCharter becomes an instruction-, knowledge-, and specification-driven repository ecosystem
architect used by an AI companion. It is not a runtime or general autonomous product-development
agent.

The companion may create or modify code, configuration, tests, documentation, instructions, and
scripts that are necessary to make the approved repository foundation operational. It may create a
minimal application entry point, health route, rendered page, test subject, or equivalent proof
that the selected stack builds and runs. It must not add substantive product features that are not
needed to establish or verify the foundation. Subsequent feature work follows the resulting
repository's specification-driven workflow.

DevCharter does not become:

- a hosted repository service;
- a provider router or model selector;
- a persistent chat, memory, or transcript service;
- a project-management platform or backlog;
- an agent runtime that replaces the selected companion;
- a general framework marketplace;
- an automatic approver;
- an automatic pull-request, push, or protected-branch writer;
- an unrestricted shell-command executor;
- a full product implementation generator.

## Primary user experience

### Invocation

The companion must accept a natural request equivalent to:

```text
Use DevCharter at <DevCharter location> in new mode with full scope for <target location> using
<plain-text or specification input>.
```

Provider-specific invocation may differ, but each integration must make mode, scope, DevCharter
location, target-project location, and initial input visible before analysis begins. A missing input
is an unresolved user decision; the companion may explain the choices but must not choose silently.

### Common lifecycle

```text
select mode and scope
→ resolve DevCharter and target locations
→ inspect target and initial input
→ ask material questions
→ produce abstract proposal
→ explicit proposal approval
→ create definitive detailed SDD specification
→ explicit specification approval
→ implement through the companion's native tools
→ run the specified verification harnesses
→ report evidence and remaining limitations
```

The companion manages any internal state without exposing transport details to the user. Proposal
approval authorizes detailed planning, not project implementation. Specification approval authorizes
implementation within the approved scope.

### New

`new` applies to an empty or lightly initialized target. The user or companion may create the target
folder and initialize source control before DevCharter analysis. If evidence establishes a mature
repository, DevCharter reports that `retrofit` is recommended and requires explicit confirmation
before continuing as `new`.

Within the selected scope, a `new` proposal may include:

- the repository and workspace layout required by the chosen stack;
- framework- or tool-generated files and directories;
- package, dependency, runtime, build, and development-server configuration;
- explicit user-requested configuration, such as a Vite development server that opens a browser on
  startup;
- environment-variable examples without secrets;
- formatting, linting, typing, testing, build, and aggregate verification commands;
- setup, local run, smoke, integration, E2E, accessibility, or other harnesses justified by the
  project and its critical journeys;
- current product, architecture, engineering, and operational documentation needed at project
  start;
- an authoritative initial specification when the intended behavior is non-trivial;
- concise cross-tool repository instructions and companion-native extensions where they add value;
- stable reusable skills for procedures that genuinely benefit from them;
- CI or deployment foundations only when requested or justified by current project needs;
- minimal application code needed to prove that the foundation runs and can be verified.

A framework initializer may legitimately produce many files. Those files are part of the initial
structure when the selected framework justifies them. DevCharter evaluates the initializer and its
configuration as one proposed component while retaining path-level review and application evidence.

### Retrofit

`retrofit` begins with preservation. It inventories existing code, commands, documentation,
specifications, tests, CI, instructions, skills, and tool configuration before proposing changes.

The default retrofit concern is the AI-assisted development ecosystem. Engineering changes are
included only when their absence materially prevents reliable AI work or when the user requests
them. Examples include installing or configuring Prettier, a linter, a type checker, a test runner,
or an aggregate verification command. Each dependency addition, manifest modification, generated
configuration file, and migration must be visible in the proposal and detailed SDD specification.

Retrofit must not replace an established framework, reorganize the application, rewrite working
configuration, or normalize files merely for preference. Broader modernization belongs in a
separate approved project specification unless it is an explicit DevCharter input.

### Audit

`audit` inspects and reports but produces no proposal, implementation specification, target command
execution, or target write. Companion-owned transient state and read-only repository access do not
violate this rule. Audit must not initialize Git, install dependencies, run framework generators,
or create target-local cache or report files.

## AI companion contract

### Required integrations

Codex, Claude Code, and GitHub Copilot must each implement the same canonical DevCharter lifecycle
and pass equivalent conformance journeys. A companion integration may use its supported native
instructions, skills, plugins, commands, or tool protocol, but provider-specific representation must
not change proposal semantics or safety requirements.

Each integration must:

- identify itself and report relevant target-environment capabilities when known;
- obtain explicit mode, scope, DevCharter location, target-project location, and initial input;
- keep the DevCharter source and target locations distinct;
- read initial chat or file context using companion-native capabilities;
- present DevCharter questions without inventing answers;
- preserve the proposal and authoritative SDD specification across the applicable approval stages;
- present concise summaries with the complete proposal and specification available for review;
- obtain both explicit approvals without manufacturing confirmation;
- implement only the approved specification through the companion's native tools;
- run specified verification and setup actions with applicable host permissions;
- distinguish non-blocking capability limitations from blocking ones and respond accordingly;
- report actual results, failures, skips, and external effects.

### Native capability policy

The implementation must verify current official documentation for each companion before selecting
native files or packaging. Shared `AGENTS.md` content may be reused where officially supported and
semantically appropriate, but provider-specific instructions must not be duplicated without need.
Skills, plugins, hooks, custom agents, or other mechanisms are generated only when a stable
repeatable need justifies them.

The first implementation specifications must record the supported native mechanisms and their
official sources for:

- Codex repository instructions and skills;
- Claude Code project instructions and reusable workflow mechanisms;
- GitHub Copilot repository, path-specific, agent, skill, or plugin mechanisms applicable to the
  supported Copilot environments.

Capability availability that varies by IDE, CLI, plan, preview state, or cloud agent must be exposed
as evidence or a limitation rather than assumed universally.

## Reasoning-model guidance

At the beginning of proposal work, the integration recommends the strongest suitable reasoning
model available for discovery synthesis, architecture, proposal formation, and planning. The
recommendation explains that these stages establish repository structure, source-of-truth authority,
safety boundaries, and verification strategy.

The integration may recommend a different model or reasoning level for implementation. High
reasoning is recommended for security-sensitive, architecture-sensitive, unfamiliar, ambiguous, or
cross-cutting work. A faster or less expensive model is acceptable for routine execution when the
approved plan is precise and the verification harness is adequate.

Model guidance is advisory. DevCharter does not name a mandatory model, automatically change the
user's selected model, route requests between providers, or weaken verification for a stronger
model.

## DevCharter and target resolution

The user provides a DevCharter location and a target-project location. Either may be a local folder
or a GitHub repository that the selected companion can access. The companion must understand which
location is read-only DevCharter guidance and which location is the project to inspect or change.

DevCharter may reside anywhere accessible to the companion. A target run must not modify the
DevCharter checkout, use it as implicit target state, or require adding DevCharter packages to the
target manifest. The user independently chooses or asks the companion to create the target location.

The initial supported distribution journey is:

1. obtain DevCharter from its repository through a local clone or companion-supported GitHub
   access;
2. provide or create the target-project location;
3. give the companion the mode, scope, both locations, and initial input;
4. let the companion follow DevCharter's instructions through proposal and SDD approvals;
5. implement only in the target after specification approval.

Registry installation, one-command bootstrap, companion marketplaces, bundled plugins, and a
standalone executable remain future distribution work. The architecture must not prevent them.

A companion may work with a local target, a checked-out remote repository, or another repository
location it natively supports. Repository cloning, branch creation, commits, pushes, or pull
requests remain actions of the selected companion and user environment rather than a DevCharter
hosting feature. They follow the companion's permissions and the approved project specification.

## Initial input and decision handling

The companion may receive a user brief through chat, Markdown, repository documentation, or an
attachment available through the host. It separates:

- repository-confirmed facts;
- facts explicitly supplied by the user;
- evidence-backed inferences;
- reversible assumptions;
- accepted decisions;
- rejected alternatives;
- unresolved material questions.

The companion may interpret natural language into canonical decision records, but it must show any
material interpretation whose meaning is not direct. Security, privacy, identity, permissions,
payments, legal behavior, destructive actions, external data sharing, secrets, migrations, and
public contracts always require explicit confirmation.

Accepted initial input can justify detailed configuration. If a user requests a specific supported
tool behavior, such as a development server opening the project automatically, the proposal,
detailed specification, and implemented configuration must include that behavior and verification
rather than falling back to a generic template.

## Conversation and durable planning state

DevCharter does not define JSON transport, runtime state, fingerprints, receipts, or session
persistence. The companion may use its ordinary conversation and tool state while inspecting,
asking questions, and preparing the abstract proposal.

After proposal approval, the companion creates one or more Markdown draft specifications in the
target repository. One file is preferred when the implementation remains cohesive. Multiple files
are appropriate when size, risk, separable subsystems, or dependency sequencing makes them
materially clearer. Their relationships and implementation order must be explicit, and only one
implementation specification becomes `active` at a time unless independent workstreams receive
separate approval.

These target specifications are the durable detailed plan. They record confirmed facts, decisions,
assumptions, scope, non-goals, affected structure, dependencies, implementation constraints,
harnesses, acceptance criteria, verification, risks, and recovery. Draft creation is authorized by
proposal approval; project implementation is not. Explicit user approval moves the applicable
specification to `ready`, after which implementation may begin.

If conversation context is lost before the draft specifications exist, the companion reinspects the
available DevCharter and target sources and reconfirms material decisions. If approval evidence is
unclear, it asks again rather than assuming approval. DevCharter never requests or stores hidden
reasoning, secrets, credentials, or complete conversation transcripts.

## Proposal model

New and retrofit proposals remain abstract. They establish justified components and boundaries
without pretending to be the definitive implementation specification. A proposal may describe:

- files and directories to create, update, preserve, skip, or mark as conflict;
- framework initializers and their exact version or resolution policy;
- packages and tools to install, remove, or configure;
- setup, generation, migration, and verification commands;
- expected network access and external effects;
- project and AI instruction authority;
- skills and reusable harnesses;
- critical developer and user journeys;
- validation expectations and recovery behavior;
- considered and rejected components;
- maintenance and ownership implications.

There is no fixed maximum proposal size or generated-file count. Large generated sets may be grouped
at proposal time. The later SDD specification provides the definitive implementation detail required
for approval and execution.

The proposal must distinguish:

- necessary foundation work;
- explicitly requested configuration;
- useful but optional recommendations;
- rejected complexity;
- future product feature work.

## Specification-driven planning and implementation

### Proposal approval

The proposal is the generic agreement about what the repository needs. It presents the desired
outcome, accepted decisions, assumptions, risks, conflicts, considered components, expected project
structure, AI-ecosystem components, harness strategy, important tools or dependencies, and deferred
product work. It may be large or small, but it does not need to predict every implementation detail.

The user's explicit proposal approval authorizes the companion to create the definitive detailed
implementation specification. It does not authorize project implementation.

### Detailed SDD specification

After proposal approval, the companion produces an authoritative Markdown implementation
specification using the repository's specification-driven development methodology. Its detail is
proportional to the work and includes, as applicable:

- confirmed context and accepted decisions;
- exact intended project and AI-ecosystem structure;
- files, directories, dependencies, tools, framework initializers, and configurations to create or
  change;
- user-requested non-default configuration;
- preservation and ownership requirements;
- implementation sequence and dependencies;
- harnesses and verification commands;
- observable acceptance criteria;
- security, privacy, permission, network, and external-effect expectations;
- failure and recovery behavior;
- documentation affected by the work;
- limitations and deferred product features.

The specification may also be presented in chat for review, but its authoritative form is one or
more Markdown draft specifications written into the target after proposal approval. This makes the
plan durable, reviewable, and available to future companion sessions. The companion chooses one
cohesive file by default and splits it only when size, dependency order, risk, or independently
reviewable workstreams make multiple files materially clearer.

### Specification approval

The user reviews the detailed specification and explicitly approves it. Approval moves the
specification from `draft` to `ready` and authorizes implementation within its defined scope. It is
not approval for unrelated improvements or material deviations.

### Implementation

After specification approval, the companion implements directly in the target repository using its
native file, terminal, package, browser, and other available tools. Framework initializers and
package installations run during this implementation stage when the approved specification requires
them. The companion follows the host's permissions and reports unavailable capabilities.

A non-blocking tool or permission limitation is recorded and implementation continues when the
approved outcome can still be achieved and verified. A blocking limitation stops the affected work,
preserves completed valid changes, and is reported to the user with the missing capability or
decision. DevCharter does not guarantee the quality of work produced by an incapable model or a host
without the tools required by the approved specification.

If implementation discovers a material need outside the approved specification, the companion
updates the specification, explains the deviation, and obtains renewed approval before continuing
that expanded work. Small implementation choices that remain within the approved behavior, risks,
and acceptance criteria do not require a new approval.

### Verification and completion

The companion runs the specification's applicable harnesses and repository-native checks, records
actual results and skipped checks, reviews the resulting diff, and maps acceptance criteria to
evidence. It reports partial completion and blockers accurately. Completion follows the repository's
normal specification lifecycle and does not depend on deterministic equality between different
models' implementations.

## AI-development ecosystem and harnesses

The output must make the repository ready for a capable AI companion to begin reliable work. The
proposal considers, and creates only when justified:

- concise repository-wide instructions;
- path-specific instructions where subtrees genuinely differ;
- companion-native instruction files where shared instructions are insufficient;
- stable skills for repeatable procedures;
- authoritative current product and engineering documentation;
- an initial or repaired specification workflow;
- build, format, lint, type-check, test, and aggregate verification commands;
- environment setup and development-server workflows;
- smoke, integration, E2E, accessibility, security, migration, or release harnesses required by
  actual critical journeys;
- CI or deployment validation requested by the user or necessary for the accepted project model;
- documentation explaining how humans and companions run and maintain the harnesses.

A harness is a repeatable mechanism that lets a human or AI companion establish state, perform an
action, observe the result, and decide success without relying on conversation history. A script,
test fixture, local service setup, browser check, or aggregate command may be a harness. Extra hooks,
agents, prompts, skills, or tools are not harnesses merely because they automate something.

## Source of truth and cross-companion output

DevCharter keeps one source of truth per concern. Shared project facts, architecture, commands, and
specifications live in ordinary project-owned files. Companion-specific files reference shared
truth instead of restating it where possible.

When multiple selected companions understand the same native shared instruction file, DevCharter
prefers that shared authority. It generates provider-specific files only for unsupported semantics,
provider-specific invocation, or stable capabilities that materially improve the workflow. It must
report routing and precedence for all generated instruction sources.

The user may select one, two, or all three supported companions for a target repository. First-class
support means DevCharter itself has a conforming integration for each companion; it does not mean
every target must receive three sets of files.

## Safety, privacy, and trust

- Repository inspection and implementation avoid secrets and unsafe material according to
  explicit bounded rules.
- Initial input and run state never authorize secret capture.
- A remote companion may access only repositories and files already available through the user's
  chosen environment and permissions.
- DevCharter does not upload repository content to a DevCharter service.
- Network access for dependency or framework resolution is explicit in the proposal or plan and
  subject to host permission.
- Third-party initializers, packages, skills, plugins, and generated assets retain provenance.
- Package scripts, hooks, CI, and repository instructions are untrusted inputs until classified.
- The companion must not disable safeguards, skip verification, or discard external changes to
  force a successful result.
- Normal local edits, framework initialization, and dependency installation described by an
  approved implementation specification need no extra DevCharter confirmation beyond the
  companion host's permissions.
- Destructive actions, secret or credential access, external data sharing, remote writes, data
  deletion or migration, and other hard-to-reverse or externally visible effects require explicit
  user confirmation immediately before execution even when the companion host permits them.
- Audit produces no target write or target command side effect.

## Failure and recovery

The lifecycle must return a clear recoverable state for:

- unavailable or unreadable target;
- unsupported companion capability;
- missing mode, scope, or material decision;
- stale or conflicting repository, proposal, or specification state;
- lost transient state;
- planning or implementation failure;
- framework or dependency resolution failure;
- network denial or unavailable package source;
- validation or verification failure;
- existing-file conflict or ambiguous ownership;
- partial application;
- companion interruption or context compaction.

Lost conversational context does not invalidate an authoritative specification or exact structured
state retained by the host. Lost or unverifiable approval evidence requires fresh review and
approval. Partial implementation reports actual changed and unattempted work and never claims
rollback without evidence.

## Compatibility and migration from v0

The v0 implementation is historical evidence, not an API or package topology to preserve. Remove
`@devcharter/core`, `@devcharter/adapter-codex`, `@devcharter/cli`, the `devcharter` binary, the
manual JSON lifecycle, deterministic rendering and application code, target-local package
installation, and tests or build infrastructure that exist only for those products.

Before deletion, extract still-relevant product knowledge, safety rules, decision criteria,
fixtures, and verification lessons into the instruction-driven architecture. Git history preserves
the implementation itself; DevCharter must not keep dead runtime code merely as documentation.

Development-only scripts may validate Markdown structure, links, native companion asset layout,
fixtures, or repository invariants. They are contributor harnesses, not a DevCharter runtime, CLI,
or target dependency.

## Rejected alternatives

- Automatic mode or scope selection without user confirmation.
- Lifecycle JSON files that users must manually create or keep in the target repository.
- A JSON-over-stdio protocol, persisted DevCharter run state, or another replacement runtime.
- Retaining v0 packages or CLI surfaces solely for backward compatibility.
- Beginning implementation before the detailed SDD specification is explicitly approved.
- Treating a generic proposal as the definitive implementation plan.
- A fixed small-file budget that rejects a justified framework structure.
- Generating every possible instruction, agent, skill, prompt, hook, CI workflow, or tool.
- Implementing full product features as an incidental part of initial ecosystem setup.
- Requiring DevCharter source, transient state, and target repository to share a directory.
- Modifying the DevCharter checkout as part of a target run.
- A hosted DevCharter repository service in this specification.
- Requiring a particular model or provider.

## Proposed implementation sequence

The approved implementation specifications are ordered as follows:

1. **SPEC-0002A — Repository transformation and shared foundation** — remove the v0 runtime packages and CLI,
   establish the instruction- and knowledge-driven repository architecture, preserve valuable v0
   lessons, and keep DevCharter/target separation explicit.
2. **SPEC-0002B — Project Architect and ecosystem methodology** — implement the proposal, detailed specification,
   scaffolding, retrofit, harness, verification, and failure-guidance instructions shared across
   companions.
3. **SPEC-0002C — Three native companion integrations** — package and adapt the shared methodology for Codex,
   Claude Code, and GitHub Copilot, including native output selection and reasoning-model guidance.
4. **SPEC-0002D — Qualification and documentation** — validate instruction assets and representative real-host
   journeys, update the user experience, remove obsolete v0 surfaces, and record limitations without
   claiming deterministic model output.

This dependency order is not permission to activate parallel implementation. Each child remains
`ready` until explicitly activated, and a later child cannot silently implement an incomplete
dependency.

## Acceptance criteria

1. The user supplies mode, scope, DevCharter location, target-project location, and plain-text or
   specification input through each supported companion integration.
2. A user can provide initial context in chat or Markdown and receives only material unresolved
   questions grounded in DevCharter analysis.
3. The user completes a new or retrofit lifecycle without running DevCharter CLI commands or
   manually creating lifecycle JSON and fingerprints.
4. Proposal approval leads to one or more detailed Markdown SDD specifications, and implementation
   cannot begin until the user explicitly approves the applicable specification.
5. Codex, Claude Code, and GitHub Copilot receive native, coherent DevCharter instructions and assets
   for the same product lifecycle without requiring deterministic equality of model output.
6. Each integration uses verified native mechanisms and reports capability or environment
   limitations rather than inventing unsupported formats.
7. Model-neutral guidance recommends strong reasoning for proposal and planning without requiring,
   selecting, or routing a specific provider model.
8. DevCharter runs from a location independent of the target and does not add itself to the target's
   project dependencies merely to operate.
9. A DevCharter source checkout remains unchanged during a target lifecycle.
10. A `new/full` journey can produce a complete runnable foundation for a representative framework,
    including its justified generated structure, requested configuration, AI ecosystem, and
    verification harnesses.
11. A user-requested supported configuration detail is represented in the proposal, detailed
    specification, implemented configuration, and verification evidence.
12. A large framework-generated structure is allowed when justified by the selected stack and is
    implemented only after the detailed specification is approved.
13. New-project output contains no substantive product feature unrelated to establishing or proving
    the approved foundation.
14. A retrofit journey preserves useful existing structure and adds an important formatter, linter,
    type checker, test runner, or verification command only when evidence and approval justify it.
15. Audit performs zero target writes, dependency installation, framework generation, mutating
    target commands, and target-local state creation; only demonstrably read-only inspection is
    permitted.
16. Proposal approval authorizes detailed SDD planning but does not authorize implementation.
17. Specification approval authorizes implementation only within the approved behavior, scope,
    risks, and acceptance criteria.
18. A material need discovered during implementation updates the specification and requires renewed
    approval before expanded work continues.
19. A blocking permission or capability failure stops affected work and is reported; a genuinely
    non-blocking limitation is recorded while unaffected implementation continues.
20. DevCharter defines no session store or machine-state protocol and never asks the companion to
    persist credentials, secrets, complete transcripts, or hidden reasoning.
21. Shared sources of truth are preferred over duplicated provider-specific instructions, and all
    instruction precedence is validated.
22. Other capable companions may use the generic guidance on a best-effort basis without being
    represented as officially tailored or qualified integrations.
23. Specified verification commands execute after implementation with actual results, timeouts,
    failures, and skips reported accurately.
24. The companion records partial implementation accurately and does not discard unrelated or
    external changes to force success.
25. A remote companion with a writable checkout can run the normal lifecycle without a hosted
    DevCharter service; a read-only remote view cannot claim application capability.
26. The three v0 runtime packages, CLI, JSON lifecycle, deterministic renderer/application, and
    target-local DevCharter installation path are removed after their reusable knowledge is
    extracted.
27. Current product, architecture, engineering, user, AI-instruction, and release documentation is
    synchronized with the implemented behavior.

## Verification mapping

| Area | Required evidence |
|---|---|
| Shared workflow | Static checks and scenario tests for required inputs, questions, proposal approval, SDD approval, implementation, and verification |
| Target independence | Separate DevCharter and target locations on Windows, macOS, and Linux |
| SDD lifecycle | Draft, review, approval, material-deviation, completion, and blocked-state scenarios |
| New journey | Empty/light target to runnable verified foundation, including requested non-default configuration |
| Retrofit journey | Established target preservation plus one justified approved engineering-tool improvement |
| Audit journey | Hostile target review proving no target writes or target command side effects |
| Companion assets | Native path, metadata, instruction, reference, and routing validation for Codex, Claude Code, and GitHub Copilot |
| Representative host use | At least one documented real-host journey per supported companion without claiming deterministic output parity |
| Approval UX | Explicit proposal approval, explicit SDD approval, rejection, revision, and ambiguous-response scenarios |
| Capability failure | Blocking and non-blocking permission, tool, network, and environment cases |
| Harness quality | Build/run/verify commands and at least one critical journey exercised end to end |
| Documentation | Source links, installation journey, user dialogue, migration, limitations, and reviewed diffs |
| Independent review | Fresh-context completion review against this specification and representative journey evidence |

Automated checks validate DevCharter-owned instructions and assets. Representative real-host
journeys demonstrate usability, but DevCharter does not guarantee equivalent or high-quality output
from every model, account, permission configuration, or future provider version.

## Affected documentation

Implementation must update or explicitly review:

- `README.md`;
- `MANIFEST.md`;
- `docs/user-guide.md`;
- `docs/product/purpose-and-scope.md`;
- `docs/architecture/system-overview.md`;
- `docs/engineering/quality-and-decision-model.md`;
- `docs/engineering/spec-driven-workflow.md`;
- official capability references for all three companions;
- packaged companion instructions and skills;
- release qualification and changelog documentation.

The manual v0 lifecycle must not remain presented as the primary experience after the companion
journey is qualified.

## External capability references

These sources inform this approved specification but do not freeze provider behavior. Implementation must reverify
current official documentation:

- Codex skills and repository skill locations: https://developers.openai.com/es-419/docs/build-skills
- Repository Codex capability record: `references/official-codex-capabilities.md`
- Claude Code CLI and external working-directory support: https://docs.anthropic.com/en/docs/claude-code/cli-usage
- Claude Code project instruction behavior: https://docs.anthropic.com/en/docs/claude-code/memory
- GitHub Copilot repository and path-specific instructions: https://docs.github.com/en/copilot/how-tos/configure-custom-instructions-in-your-ide/add-repository-instructions-in-your-ide
- GitHub Copilot CLI customization and plugin surface: https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/overview

## Resolved readiness decisions

The user explicitly resolved the remaining product decisions on 2026-09-18:

- remove the v0 CLI, all three runtime packages, JSON transport/state, deterministic renderer, and
  DevCharter application boundary;
- make DevCharter an instruction-, knowledge-, skill-, and specification-driven tool used directly
  by the selected AI companion;
- allow proposal approval to authorize creation of one or more Markdown draft implementation
  specifications in the target repository;
- require specification approval before implementation;
- require immediate confirmation for destructive, secret-accessing, external-data-sharing, remote,
  or hard-to-reverse actions even when the companion technically permits them;
- support Codex, Claude Code, and GitHub Copilot with tailored assets while allowing other companions
  to use generic guidance without a quality guarantee;
- supersede SPEC-0001 as product authority while retaining the v0 specifications as historical
  implementation evidence;
- create ordered implementation specifications before any implementation becomes active.

Native packaging details and representative-host qualification are delegated to their ready child
specifications. This parent satisfies its readiness gate; no implementation becomes active merely
because the parent and children are ready.

## Completion gate

SPEC-0002 can move to `done` only after all required implementation specifications are complete,
DevCharter-owned assets for the three supported companions pass their checks and representative
journeys, new/retrofit/audit guidance matches the accepted boundaries, the DevCharter checkout and
target remain correctly isolated, obsolete v0 behavior is removed or intentionally retained,
migration and current documentation are complete, actual verification evidence is recorded, and an
independent reviewer finds no unresolved material deviation.
