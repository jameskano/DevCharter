# SPEC-0002D — Qualification, Documentation, and Release Transition

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0002D |
| Parent | SPEC-0002 |
| Status | ready |
| Approval | User requested final ready implementation specifications on 2026-09-18 |
| Dependencies | SPEC-0002A, SPEC-0002B, SPEC-0002C |
| Enables | Companion-driven DevCharter release |

## Purpose

Qualify the companion-driven DevCharter as one coherent product, remove obsolete v0 guidance, and
publish sufficient documentation and evidence for a user who has only a target idea or repository
and an AI coding companion. This specification validates the combined experience; it does not add a
new runtime, installer, hosted service, or project-management layer.

## Release boundary

The qualified release consists of:

- the approved companion-driven product specification and completed implementation specs;
- the Project Architect and Specification Architect workflow;
- shared knowledge, templates, examples, and verification scenarios;
- native entrypoints for Codex, Claude Code, and GitHub Copilot;
- contributor checks needed to maintain the static instruction and knowledge system;
- current user, architecture, engineering, migration, and contribution documentation.

The TypeScript CLI/runtime packages, JSON lifecycle, deterministic renderer/writer, target-local
DevCharter dependency, and their installation instructions are absent from the released product.
Historical specifications remain clearly labeled as evidence and are not presented as current use.

## Required end-to-end journeys

### New project, full scope

Start from an empty or lightly initialized target and a substantive product brief. The proposal and
detailed plan must cover a complete ready-to-code foundation: chosen framework structure, relevant
configuration, current documentation, AI instructions, appropriate engineering tools, and critical
harnesses. Include at least one explicit non-default request, such as opening the browser when the
development server starts, and verify it in the resulting configuration or observable behavior.

### New project, focused scope

Exercise a narrower scope, especially `ai`, to prove that scope selection constrains output and
does not silently create an entire application or unrelated engineering stack.

### Existing project retrofit

Use a representative established repository. Preserve its framework, source structure, useful
configuration, and user-owned content. Propose and apply at least one justified AI-ecosystem
improvement and one important engineering tool or harness only after explicit approval.

### Focused retrofit

Exercise `retrofit` with `ai` scope and verify that important observations outside scope may be
reported but are not written without an explained dependency and approval.

### Audit

Run a hostile no-write audit against a fixture capable of exposing incidental writes. Confirm no
target file, lockfile, cache, dependency, Git metadata, report file, or external state is changed.

### Proposal and SDD lifecycle

Exercise both a small implementation represented by one Markdown specification and a larger effort
split into ordered Markdown specifications. Verify that proposal approval authorizes only detailed
planning, each implementation spec is reviewed before activation, and material deviations return
to review.

### Capability and safety failures

Verify a non-blocking unavailable tool, a blocking permission failure, attempted secret access, an
external-data-sharing action, a remote write, and a destructive or hard-to-reverse action. Safe
independent work may continue, but required confirmation and gates must not be bypassed.

## Qualification strategy

### Static integrity

Check Markdown structure, links, referenced files, specification relationships, companion metadata,
native placement rules, duplicate authority, stale terminology, and examples. Static tooling is a
contributor harness and must not become a target dependency or public DevCharter runtime.

### Scenario evaluation

Fixtures and scripted or documented walkthroughs validate the decisions DevCharter owns:
inspection order, question quality, proposal completeness, component justification, approval
boundaries, source-of-truth handling, preservation, scope control, safety, and verification design.

Evaluation may use stable assertions for required sections and effects, plus rubric-based review
for reasoning quality. It must not pretend that model prose or file layout is byte-for-byte
deterministic.

### Real-host qualification

Run at least one representative journey in a supported environment for Codex, Claude Code, and
GitHub Copilot. Capture companion and host versions or dates, inputs, approvals, outputs, commands,
results, limitations, and manual observations. A real-host limitation is release evidence, not a
reason to invent compatibility.

### Independent review

A fresh-context reviewer checks for overengineering, missing questions, unsupported claims,
conflicting authority, unsafe instructions, inadequate harnesses, and accidental retention of the
old product model.

## Documentation requirements

### Main README

Lead with the companion-driven experience. Explain what DevCharter does, supported modes and scopes,
supported companions, the five required inputs, local-clone and companion-accessible GitHub use,
the two approval gates, model guidance, output expectations, limitations, and a concise first run.

### User guide

Provide step-by-step new, retrofit, and audit journeys with example dialogue. Explain that the user
chooses or asks the companion to create the target location, DevCharter may live elsewhere, draft
SDD specifications are written after proposal approval, and implementation begins only after plan
approval. Document capability failures and sensitive-operation confirmations.

### Architecture and contributor documentation

Describe the static instruction/knowledge architecture, source-of-truth boundaries, companion
adaptation, knowledge freshness, verification harnesses, and how to add or update a technology or
companion safely. Remove architecture that describes the CLI/runtime as current.

### Migration and history

Explain that SPEC-0002 replaces the v0 runtime product completely. State what was removed, what
knowledge was retained, why command compatibility is not provided, and how historical
SPEC-0001/0001A–E should be interpreted.

## Implementation tasks

### D1. Build the qualification matrix

Map every parent and child acceptance criterion to static, scenario, real-host, or manual evidence.

### D2. Implement fixtures and journey checks

Create representative new, retrofit, audit, plan-lifecycle, failure, and sensitive-operation
fixtures without embedding one technology as a universal answer.

### D3. Run companion qualification

Execute the supported-companion journeys, record versions and actual evidence, and classify all
limitations.

### D4. Rewrite current documentation

Update the README, user guide, architecture, engineering workflow, contribution guidance, manifest,
and specification index. Remove or clearly historicize obsolete v0 instructions.

### D5. Complete release review

Run all applicable contributor checks, review the final diff and repository inventory, record
skips, and prepare release evidence and migration notes.

## Acceptance criteria

1. A new user can understand the product and begin with any supported companion from the main
   README without discovering the old CLI workflow.
2. The user guide covers new, retrofit, and audit from the five inputs through their correct final
   stage.
3. The full new-project journey creates a complete ready-to-code foundation and proves an explicit
   non-default configuration.
4. Focused-scope journeys do not create unrelated ecosystem components.
5. Retrofit preserves useful existing content and applies only approved, justified additions.
6. Audit causes zero target and external mutations.
7. One-file and multi-file Markdown SDD journeys enforce separate proposal and implementation-plan
   approvals.
8. Blocking, non-blocking, and sensitive-operation scenarios follow the specified safety policy.
9. Codex, Claude Code, and GitHub Copilot each have recorded representative real-host evidence or an
   explicit release-blocking failure.
10. Qualification evaluates owned instructions and effects without claiming deterministic model
    output parity or guaranteeing weak-model performance.
11. DevCharter and target locations remain distinct, and qualification detects attempted writes to
    the DevCharter source during a target run.
12. The released repository contains no operational CLI, runtime package, JSON lifecycle, target
    package installation, or current documentation pointing users to those surfaces.
13. SPEC-0001 and SPEC-0001A–E remain accessible and unambiguously historical.
14. Current product, architecture, engineering, user, and contributor documents agree with
    SPEC-0002.
15. All references and specification relationships resolve, and there is one current authority for
    each behavior.
16. No empty placeholder knowledge profile, template, integration, harness, or documentation file
    is counted as complete.
17. Every acceptance criterion across SPEC-0002 and SPEC-0002A–D maps to actual evidence, an
    approved limitation, or a release-blocking gap.
18. Applicable formatting, static validation, tests, and scenario checks pass, with actual results
    and skips recorded.

## Verification evidence format

Completion evidence records:

- the exact scenario, fixture, companion, host, date, and relevant version;
- starting state and the five user inputs;
- questions, proposal, approvals, SDD plan, implementation, and verification stages exercised;
- changed and preserved paths plus external effects;
- commands or manual procedures and their actual results;
- criterion identifiers satisfied;
- limitations, failures, skipped checks, and approved deviations;
- final reviewer and review outcome.

Sensitive values and full private conversations must not be captured. Evidence may summarize
dialogue while preserving the decisions and approvals needed to verify the lifecycle.

## Completion gate

Do not mark SPEC-0002D `done` or describe the transformation as released until all parent and child
criteria have traceable evidence, all supported-companion journeys have been attempted in real
hosts, audit no-write behavior is demonstrated, obsolete operational surfaces and documentation are
absent, the independent review has no unresolved blocker, and the user-facing migration path is
clear. Report any unavailable external host or skipped check honestly; a release-blocking gap cannot
be converted into a documentation note without explicit approval.
