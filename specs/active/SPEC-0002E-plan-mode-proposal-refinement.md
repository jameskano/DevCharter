# SPEC-0002E — Plan-Mode Proposal Refinement and Durable Specification Handoff

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0002E |
| Parent | SPEC-0002 |
| Status | ready |
| Proposal approval | User approved the plan-mode proposal-refinement proposal on 2026-09-21 |
| Specification approval | User explicitly requested this implementation specification in `ready` on 2026-09-22 |
| Dependencies | SPEC-0002B, SPEC-0002C, SPEC-0002D |
| Implementation state | Not started; move this specification to `active` before implementation |

## Problem and desired outcome

DevCharter already requires inspection, material questions, a reviewable proposal, proposal
approval, one or more Markdown implementation specifications, separate specification approval,
implementation, and verification. It also defines the Markdown specifications as durable planning
state that can support a future companion session.

The current guidance does not recommend a companion's native Plan mode, define how a native plan
maps to the DevCharter lifecycle, or clearly tell users that approved specifications can drive
implementation in the same conversation or a later one. Its instruction to ask only material
questions prevents noise, but it does not explicitly require every unresolved material question
needed to improve the proposal or state that question completeness takes precedence over minimizing
the number of questions.

The desired outcome is a clear, provider-aware workflow in which:

1. a user in `new` or `retrofit` mode is encouraged to use native Plan mode when the selected host
   provides a suitable interactive planning surface;
2. the native plan is the DevCharter proposal, not the definitive implementation specification;
3. the companion asks as many evidence-grounded, material questions as needed, over one or more
   rounds, and prefers answers over avoidable assumptions;
4. proposal approval authorizes only one or more target-local Markdown draft specifications;
5. specification approval remains the sole implementation gate; and
6. the approved specifications can govern implementation in the same chat or a later chat without
   introducing a DevCharter session store or transcript protocol.

## Authority and terminology

SPEC-0002 remains the parent product and architecture authority. This specification extends its
companion-driven lifecycle without changing the stable modes, scopes, statuses, audit boundary, or
two approval gates.

The implementation must use these terms consistently:

| Term | Meaning | Approval effect |
|---|---|---|
| Native Plan mode | An optional host capability used for read-only discovery, questioning, and proposal refinement | None by itself |
| DevCharter proposal | The reviewable outcome of Project Architect, whether rendered through native Plan mode or ordinary conversation | Explicit approval authorizes Markdown specification drafting only |
| Markdown implementation specification | The definitive, durable implementation plan created through Specification Architect | Explicit approval moves the applicable spec to `ready` and authorizes its bounded implementation |

A host may label its native output an “implementation plan” or offer an approval action that
normally begins coding. Within a DevCharter run, that first plan still occupies the proposal stage.
Host terminology or permission must not collapse proposal approval and specification approval.

## Scope

### In scope

- Plan-mode recommendations for `new` and `retrofit` journeys when the selected companion and host
  surface support an appropriate mode.
- A provider-neutral fallback when native Plan mode is unavailable, unsuitable, or disabled.
- Canonical Project Architect behavior for iterative material questions and constrained assumptions.
- The exact mapping from native plan to proposal, proposal approval to specification drafting, and
  specification approval to implementation.
- One-spec and justified multi-spec planning after proposal approval.
- Same-conversation and later-conversation implementation handoff from approved Markdown specs.
- Supported-companion setup guidance and dated capability evidence for Codex, Claude Code, and
  GitHub Copilot.
- Static, scenario, manual, and fresh-context verification of the refined lifecycle.

### Non-goals

- No new public mode, scope, status, command, runtime, package, service, adapter protocol, or
  target-local DevCharter installation.
- No mandatory use of native Plan mode and no claim that every companion or host surface supports
  it.
- No persisted proposal database, approval receipt, interview transcript, session protocol, or
  hidden conversation state.
- No treatment of a native plan as the definitive Markdown implementation specification.
- No authorization to begin implementation from proposal approval or a host's first plan-approval
  control.
- No fixed number of questions, mandatory questionnaire, or questioning of facts that reliable
  repository inspection can answer.
- No change to `audit`: it remains a read-only findings journey with no proposal, specification, or
  implementation gate.
- No broad redesign of companion adapters, historical specifications, or completed qualification
  evidence merely to restate the new guidance.

## Confirmed facts and accepted decisions

### Confirmed repository facts

- SPEC-0002 and current documentation already define proposal approval followed by one or more
  Markdown specifications and a separate implementation approval.
- SPEC-0002 already makes target-local Markdown specifications durable across future companion
  sessions.
- Current Project Architect guidance says to inspect before asking and to ask only material
  questions, while allowing evidence-backed low-risk reversible assumptions.
- Current user and companion guides do not recommend Plan mode or define native-plan equivalence to
  the DevCharter proposal.
- Codex, Claude Code, and GitHub Copilot capability records are dated, refreshable evidence rather
  than permanent guarantees of host behavior.

### Accepted user decisions

- Recommend Plan mode when a user wants a better-refined proposal and the selected host supports it.
- Treat the AI companion's native plan as the DevCharter proposal at the first approval gate.
- Encourage the companion to ask as many questions as necessary to refine the proposal and to make
  fewer assumptions.
- After proposal approval, create one or several Markdown implementation specifications according
  to justified size, risk, subsystem independence, or dependency order.
- Allow the user to start implementation from the approved specification files in the same chat or
  another chat.
- Prepare this specification as one cohesive ready implementation specification.

### Assumptions and open questions

There are no unresolved material questions. Host availability and exact controls are variable
capabilities, not assumptions: implementation must recheck official provider documentation and
record the verification date before publishing host-specific instructions.

## Required behavior

### 1. Plan-mode recommendation and fallback

For `new` and `retrofit`, user-facing guidance must recommend native Plan mode when it is available
and the user wants a more thoroughly refined proposal. The recommendation must explain that Plan
mode is useful because it supports read-only inspection, clarification, iteration, and review before
implementation.

The recommendation is conditional, not a sixth required input or a new DevCharter mode. If the
selected companion lacks Plan mode, the companion must perform the same discovery-and-proposal
workflow in ordinary interactive conversation: inspect first, interview the user as needed, present
the proposal, and stop at the proposal gate.

Provider-specific entrypoints may describe verified commands, flags, key bindings, or UI controls.
Shared sources must remain provider-neutral and must route readers to dated capability records for
surface-specific facts.

### 2. Complete material questioning with fewer assumptions

Repository inspection remains prior to questioning. The companion must not ask the user to supply
facts that reliable, safe inspection can establish, and it must not ask preference questions that
cannot materially change behavior, architecture, scope, output, ownership, safety, verification, or
user expectations.

After inspection, the companion must ask every unresolved material question needed to produce a
reliable proposal. It may group related questions and use as many rounds as needed. No arbitrary
question-count or single-round limit may force premature proposal synthesis.

The companion must prefer a direct user decision over an assumption when the answer could
materially improve or change the proposal. A proposal-changing question may remain unresolved only
when the user explicitly defers it, accepts a stated default, or authorizes a clearly recorded
low-risk reversible assumption. Every retained assumption must state its evidence, impact if wrong,
and reversibility. Sensitive, externally visible, irreversible, or public-contract decisions still
require explicit confirmation and cannot become assumptions.

The companion may present the proposal when repository-answerable matters have been inspected and
no unresolved question would materially change it without an explicit user deferral or accepted
assumption. “Ask all material questions” must not become exhaustive questioning about immaterial
preferences or already-settled facts.

### 3. Native plan as the DevCharter proposal

When native Plan mode is used, its reviewable output must satisfy the Project Architect proposal
contract, including desired outcome, verified inputs, evidence, decisions, assumptions, open
questions or accepted deferrals, proposed and preserved components, rejected alternatives, risks,
verification strategy, deferred work, and the expected one- or multi-spec breakdown.

The native plan may contain implementation-oriented detail, but its lifecycle role remains the
proposal. The companion must clearly state before approval that accepting it authorizes only
creation of the Markdown specification or specifications. A host control that would immediately
start coding must not be invoked as the DevCharter proposal-approval action.

If the host's Plan mode is read-only, the companion may switch to an editing-capable mode after
explicit proposal approval solely to create or update the authorized Markdown specs. It must stop
again for specification review and must not scaffold, install, modify product files, or begin any
other implementation work.

### 4. Markdown specification creation and approval

After explicit proposal approval, Specification Architect creates one cohesive target-local
Markdown draft by default. It may split the work only when material size, risk, independently
reviewable subsystems, or dependency sequencing makes multiple specs clearer. Each split must have
an explicit relationship and implementation order.

The Markdown spec or specs are the definitive implementation plan. They must preserve the approved
proposal's scope and decisions, resolve implementation detail, define observable acceptance
criteria, and map those criteria to practical verification. A material expansion returns the
affected proposal and specification content to review.

Only explicit approval of the applicable Markdown specification moves it to `ready` and authorizes
implementation. Host permissions, native plan approval, or permission to draft the specs cannot
satisfy this gate.

### 5. Same-chat and later-chat implementation

In the same conversation, the companion may proceed after explicit specification approval by
moving one ready specification to `active`, implementing only its bounded behavior, and following
the existing verification and completion rules.

In a later conversation, the user may point the companion to the authoritative Markdown specs. The
companion must read applicable repository instructions, the approved proposal context recorded in
the specs, current repository state, spec relationships, approval metadata, and status before
implementation. It may move one current `ready` specification to `active` and implement it without
requiring the original chat transcript.

If approval evidence is absent or unverifiable, a spec is not `ready`, repository state materially
invalidates the plan, or the files conflict, the companion must refresh the affected analysis and
obtain the required review or approval. It must not invent approval or restore conversation state
through a new persistence mechanism.

### 6. Audit and safety preservation

`audit` must remain read-only and must not produce a proposal merely because native Plan mode is
available. Existing requirements for immediate confirmation of destructive actions, secrets,
external data sharing, remote writes, migrations, and other hard-to-reverse effects remain in
force after both approvals.

## Implementation scope and sequence

### E1. Align canonical product and decision authority

**Reason:** Prevent ambiguous use of “plan,” “proposal,” and “implementation plan.”

**Scope:**

- `AGENTS.md`
- `specs/approved/SPEC-0002-companion-driven-devcharter.md`
- `knowledge/shared-foundation.md`
- `knowledge/companion-integration-contract.md`
- `docs/product/purpose-and-scope.md`
- `docs/engineering/quality-and-decision-model.md`
- `docs/engineering/spec-driven-workflow.md`, only where durable plan handoff needs clarification

**Acceptance evidence:** Static review demonstrates one consistent three-stage vocabulary and the
unchanged two approval gates.

**Dependencies and risks:** This task controls later wording. Avoid implying that native Plan mode
is required or that every implementation question must be asked before the abstract proposal.

### E2. Refine Project Architect and Specification Architect behavior

**Reason:** Make the question-first behavior and approval mapping operational for AI companions.

**Scope:**

- `.agents/skills/project-architect/SKILL.md`
- `.agents/skills/specification-architect/SKILL.md`

**Acceptance evidence:** Scenario review demonstrates inspection before questions, multiple
question rounds when needed, fewer assumptions, proposal-only native plan approval, and a separate
Markdown-spec gate.

**Dependencies and risks:** Depends on E1. Keep the skills concise and canonical; do not duplicate
provider UI instructions in shared skills.

### E3. Update user journeys and native companion entrypoints

**Reason:** Make the improved workflow discoverable and safe for actual users.

**Scope:**

- `README.md`
- `docs/user-guide.md`
- `docs/architecture/system-overview.md`
- `companions/codex/README.md`
- `companions/claude-code/README.md`
- `companions/github-copilot/README.md`
- `references/official-codex-capabilities.md`
- `references/official-claude-code-capabilities.md`
- `references/official-github-copilot-capabilities.md`

The implementation must review thin native adapters and prompt files, including the Claude plugin
adapter and `.github/prompts/devcharter.prompt.md`, but change them only if canonical routing is
insufficient to preserve the lifecycle.

**Acceptance evidence:** Each supported entrypoint provides accurate, dated, host-appropriate
guidance or a documented limitation; the user guide covers native Plan mode, fallback conversation,
spec-only transition, and same- or later-chat implementation.

**Dependencies and risks:** Depends on E1-E2 and refreshed official sources. Host-native “approve”
or “start implementation” wording is the main bypass risk.

### E4. Add regression scenarios and static checks

**Reason:** Prevent later wording drift from collapsing the approval gates or minimizing necessary
questions.

**Scope:**

- `tests/fixtures/project-architect-scenarios.json`
- `tests/scenarios/project-architect-methodology.md`
- `tests/scenarios/project-architect-walkthrough-results.md`
- `tests/fixtures/companion-integration-scenarios.json` and its walkthrough results when
  provider-surface behavior is exercised
- `scripts/validate-assets.mjs`

Add focused coverage for:

- native Plan mode producing the proposal and no implementation;
- multiple rounds of material questions before proposal synthesis;
- rejection of repository-answerable or immaterial questions;
- explicit acceptance or deferral of any proposal-changing assumption;
- proposal approval authorizing Markdown specs only;
- read-only Plan mode transitioning to spec authoring without product implementation;
- one- and multi-spec selection;
- same-chat implementation and fresh-context implementation from a current approved spec;
- stale, conflicted, or unverifiable approval recovery;
- ordinary-conversation fallback and unchanged audit behavior.

Do not rewrite completed SPEC-0002D qualification results as if these later scenarios had been part
of that historical run. Record new completion evidence in this specification or a clearly dated
new result artifact if the evidence is too large to remain here.

**Acceptance evidence:** Contributor checks detect missing canonical terminology, gate collapse,
unqualified provider claims, and required scenario failures.

**Dependencies and risks:** Depends on E1-E3. Assertions should validate owned semantics and
observable effects, not exact model prose.

### E5. Synchronize current documentation and complete qualification

**Reason:** Leave one current, reviewable source of truth after implementation.

**Scope:**

- `MANIFEST.md`
- `specs/README.md`
- `CHANGELOG.md`
- this specification's completion evidence
- review of `docs/release/companion-driven-qualification.md` without retroactively changing its
  historical claims unless a dated addendum is explicitly warranted

**Acceptance evidence:** Current status and relationships agree, affected documentation is recorded,
all checks pass, and a fresh-context completion review finds no unresolved blocker.

**Dependencies and risks:** Depends on E1-E4. Do not describe SPEC-0002E as complete before actual
verification and documentation review.

## Acceptance criteria

1. Given a `new` or `retrofit` user on a host with a suitable native Plan mode, when the user reads
   the main or companion guidance, then Plan mode is recommended as an optional way to improve the
   proposal through inspection, clarification, and iteration before implementation.
2. Given a companion or host without suitable Plan mode, when the user begins a DevCharter run,
   then ordinary interactive conversation follows the same question, proposal, and approval
   contract without claiming degraded safety or inventing another mode.
3. Given unresolved decisions after repository inspection, when any answer could materially change
   architecture, output, ownership, safety, verification, scope, or user expectations, then the
   companion asks all such questions over as many rounds as needed before presenting the proposal,
   unless the user explicitly defers the decision or accepts a stated assumption or default.
4. Given a repository-answerable fact or an immaterial preference, when the companion prepares the
   proposal, then it obtains the fact by safe inspection or omits the immaterial question rather
   than burdening the user.
5. Given a proposed assumption, when it is retained, then it is low risk and reversible, records
   evidence, impact if wrong, and reversibility, and does not replace any sensitive or materially
   proposal-changing user decision without explicit acceptance.
6. Given a run conducted in native Plan mode, when the companion presents its plan, then the output
   satisfies the Project Architect proposal contract and clearly identifies itself as the
   DevCharter proposal rather than the definitive Markdown implementation specification.
7. Given explicit approval of the native plan or proposal, when the companion continues, then it
   creates or updates only the authorized target-local Markdown draft specification or
   specifications and performs no product implementation, scaffolding, dependency installation, or
   unrelated target write.
8. Given a host control that normally starts implementation after plan approval, when DevCharter is
   in the proposal stage, then the instructions prevent that control from bypassing specification
   creation, review, and separate approval.
9. Given an approved proposal, when Specification Architect chooses the durable plan shape, then it
   creates one cohesive Markdown spec by default and uses multiple related, ordered specs only when
   material size, risk, subsystem independence, or dependency sequencing justifies the split.
10. Given a Markdown implementation specification that has not received explicit approval, when
    implementation is requested, then implementation remains blocked; only approval of the
    applicable spec moves it to `ready` and authorizes its bounded behavior.
11. Given a current approved spec in the same conversation, when implementation begins, then one
    ready spec moves to `active` and implementation remains within its scope and verification
    contract.
12. Given a later conversation with access to the approved Markdown specs, when implementation is
    requested, then the companion can reconstruct authority from repository files without the
    original transcript, while stale state, conflicts, missing approval, or non-ready status cause
    refresh and renewed review rather than invented approval.
13. Given `audit` mode, when native Plan mode is available, then the journey still ends with
    read-only findings and creates no proposal, spec, target state, or external side effect.
14. Given the three supported companion entrypoints, when their guidance is reviewed against
    refreshed official sources, then host-specific Plan-mode instructions and limitations are
    accurate as of a recorded date and the shared lifecycle remains provider-neutral.
15. Given the completed implementation, when current instructions, skills, knowledge, docs,
    companion routes, capability records, fixtures, and checks are reviewed together, then they use
    consistent terminology, preserve both approval gates, and contain no stale contradictory route.
16. Given the final worktree, when contributor verification and independent completion review run,
    then `npm run verify`, `git diff --check`, scenario evidence, documentation review, and every
    SPEC-0002E acceptance criterion have recorded results with failures, skips, and limitations
    reported accurately.

## Verification mapping

| Criteria | Verification |
|---|---|
| 1-2 | Static assertions across README, user guide, shared integration contract, and companion entrypoints; manual fallback walkthrough |
| 3-5 | Project Architect scenario with repository-answerable facts, multiple material question rounds, explicit deferral, accepted reversible assumption, and rejected sensitive assumption |
| 6-8 | Native-plan lifecycle scenario and manual cross-host review proving that proposal approval permits spec authoring only |
| 9-10 | Existing one- and multi-spec lifecycle scenarios refined to distinguish native plan, proposal, and Markdown specification approval |
| 11-12 | Same-context and fresh-context walkthroughs, including stale repository and unverifiable-approval negative cases |
| 13 | Existing hostile-audit snapshot and static audit-boundary assertions |
| 14 | Dated official-source review for Codex, Claude Code, and GitHub Copilot plus entrypoint/capability-record consistency checks |
| 15 | Repository validator checks for canonical routes, required terminology, approval order, references, and prohibited stale wording |
| 16 | `npm run verify`, `git diff --check`, reviewable diff, acceptance mapping, affected-documentation review, and fresh-context independent completion review |

## Risks and trade-offs

- **Terminology collision:** Providers may call their native output an implementation plan. The
  specification accepts host wording but fixes its DevCharter lifecycle role as the proposal.
- **Gate bypass:** Some host approval controls may immediately start implementation. User and
  companion guidance must explain the spec-authoring-only transition before that control is used.
- **Over-questioning:** The requirement to ask all material questions could become a generic
  questionnaire. Inspection-first and materiality rules remain mandatory boundaries.
- **Under-questioning:** Optimizing for a short interaction may preserve avoidable assumptions.
  Question completeness therefore takes precedence over minimizing question count.
- **Capability drift:** Provider commands and UI labels may change. Dated capability records and a
  provider-neutral fallback contain this risk.
- **Duplicated authority:** Repeating the complete lifecycle in every adapter can cause drift. Shared
  skills and the integration contract remain canonical; entrypoints contain only actionable host
  setup and limitations.

## Failure and recovery

- If official documentation does not establish a native Plan-mode capability for a selected host,
  document the limitation and use ordinary interactive conversation.
- If Plan mode cannot write the approved Markdown specs, switch to a permitted editing surface only
  after proposal approval and constrain the action to spec authoring.
- If the host begins implementation prematurely, stop affected work, inspect actual changes,
  preserve unrelated work, report the gate violation, and obtain a valid specification and approval
  before continuing.
- If a later session cannot verify the spec's status or approval, keep implementation blocked and
  request fresh review or approval.
- If repository state materially changes after approval, refresh the affected proposal and spec
  rather than relying on stale conversation state.
- If verification finds conflicting terminology or lifecycle routing, keep this specification
  `active`, correct the authoritative source and dependents, and rerun the affected checks.

## Documentation impact

Implementation must update or explicitly review:

- root contributor and target-use instructions;
- the parent product specification and specification index;
- product, architecture, decision, workflow, README, and user-guide documentation;
- Project Architect and Specification Architect skills;
- shared foundation and companion integration contract;
- all supported companion entrypoints and dated capability records;
- applicable scenario fixtures, walkthrough evidence, static validation, manifest, and changelog;
- completed historical specs and qualification records, which should remain unchanged unless a
  current-documentation link or a clearly dated addendum is required.

## Completion gate

SPEC-0002E may move from `active` to `done` only when:

1. every acceptance criterion maps to implementation and actual verification evidence;
2. canonical and user-facing sources consistently distinguish native plan/proposal from Markdown
   implementation specification;
3. question completeness, assumption limits, fallback behavior, one- and multi-spec planning, both
   approval gates, same-chat handoff, later-chat recovery, and audit preservation have scenario or
   static evidence as mapped above;
4. supported-companion capability claims have refreshed dates and official sources;
5. `npm run verify`, `git diff --check`, and any narrower affected checks pass or have accurately
   recorded blocking failures;
6. current documentation is updated or reviewed unchanged with reasons;
7. no runtime, session store, target-local DevCharter installation, extra public vocabulary, or
   unrelated later-spec scope has been added; and
8. a fresh-context reviewer reads this specification before the diff and reports no unresolved
   blocking or important finding.

## Completion evidence

Implementation has not started. Record changed and preserved paths, acceptance mapping, commands,
actual results, failures, skips, limitations, documentation review, deferred work, and independent
review here before recommending `done`.
