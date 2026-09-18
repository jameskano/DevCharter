# SPEC-0002B — Project Architect Methodology and Knowledge

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0002B |
| Parent | SPEC-0002 |
| Status | ready |
| Approval | User requested final ready implementation specifications on 2026-09-18 |
| Dependencies | SPEC-0002A |
| Enables | SPEC-0002C, SPEC-0002D |

## Purpose

Implement the shared DevCharter intelligence that guides an AI companion from the user's five
inputs through evidence-based questions, a reviewable proposal, one or more detailed SDD
specifications, approved implementation, harness-driven verification, and accurate reporting.

This is instruction and knowledge engineering, not a deterministic runtime. The companion performs
repository inspection, reasoning, authoring, implementation, and verification using its native
tools.

## Required user inputs

Every journey begins with:

1. mode: `new`, `retrofit`, or `audit`;
2. scope: `full`, `governance`, `engineering`, or `ai`;
3. DevCharter location;
4. target-project location;
5. initial context in plain text, referenced files, or specifications.

Missing values are requested before substantive analysis. The companion may explain choices and
recommend a correction when repository evidence conflicts with the selected mode, but it does not
silently replace the user's selection.

## Shared Project Architect workflow

### Inspect before asking

The companion reads applicable target instructions and current documentation, then inventories the
selected scope. It distinguishes:

- current authoritative material from historical or superseded material;
- project-authored, third-party, generated, vendor, and unknown-origin artifacts;
- developer-AI configuration from runtime/product AI;
- confirmed facts from inferences and assumptions;
- supported commands from examples or stale references;
- adequate existing foundations from gaps, conflicts, duplication, and unjustified complexity.

The methodology must remain useful across technology stacks. It uses relevant knowledge profiles
without treating the absence of a profile as permission to guess.

### Ask material questions

Ask only questions whose answers materially affect architecture, output, safety, ownership,
verification, or user expectations. Group related questions when that reduces unnecessary turns.

Require explicit confirmation for security, privacy, identity, permissions, payments, legal
behavior, secrets, destructive behavior, data deletion, migrations, external data sharing, remote
writes, and other hard-to-reverse or externally visible effects.

### Produce the abstract proposal

For `new` and `retrofit`, present a proposal containing:

- desired outcome;
- selected mode, scope, companions, technologies, and tools;
- confirmed facts, assumptions, accepted decisions, rejected alternatives, and unresolved conflicts;
- proposed repository structure and ecosystem components;
- important dependencies, initializers, configurations, and engineering tools;
- AI instructions, skills, prompts, agents, hooks, docs, specifications, and harnesses considered;
- one justified create, update, preserve, skip, replace, or reject decision per relevant component;
- ownership and maintenance implications;
- security, permission, network, and external-effect expectations;
- verification strategy and critical journeys;
- deferred product features and reasons;
- the expected SDD specification breakdown.

The proposal may be large or small. Do not equate minimum-sufficient with artificially small, and do
not add components merely because DevCharter has guidance for them.

### Proposal approval

The companion asks the user to approve the current proposal explicitly. Approval authorizes
creation of draft planning specifications in the target; it does not authorize implementation.
Material proposal changes require renewed approval.

### Create detailed SDD specifications

Create one cohesive Markdown draft by default. Create multiple specifications when implementation
size, risk, independent subsystems, or dependency sequencing makes the split materially clearer.

Each detailed specification includes only applicable sections from:

- metadata, status, parent, dependencies, supersession, and approval evidence;
- problem, desired outcome, scope, non-goals, and required behavior;
- exact intended project structure and AI ecosystem;
- configuration and tool requirements;
- facts, decisions, assumptions, rejected options, and open questions;
- implementation constraints and sequence;
- security, privacy, permissions, network, migration, failure, and recovery rules;
- harnesses and critical journeys;
- observable acceptance criteria and verification mapping;
- affected current documentation;
- readiness and completion gates.

The user reviews the draft files. Only explicit approval moves a draft to `ready`. Implementation
begins with one ready specification moving to `active`. A material implementation deviation updates
the specification and requires renewed approval before expanded work continues.

### Implement and verify

After specification approval, the companion uses its native tools to implement within the target.
It follows repository instructions, preserves unrelated work, and uses the narrowest verification
that covers each change before broader journey-level checks.

For capability or permission failures:

- continue and record the limitation when it is genuinely non-blocking and the accepted outcome can
  still be achieved and verified;
- stop affected work and explain the missing capability when it blocks an acceptance criterion;
- never bypass safeguards or discard existing work to manufacture success.

Normal local operations already described by the approved specification need no extra DevCharter
confirmation. Immediately reconfirm destructive actions, secret access, external data sharing,
remote writes, data deletion or migration, and other hard-to-reverse or externally visible effects.

### Complete

Map every acceptance criterion to implementation and actual evidence. Report commands, results,
skips, limitations, conflicts, deferred work, affected documentation, and partial completion
accurately. Recommend `done` only when the specification's completion gate is satisfied.

## Mode behavior

### New

Create a complete ready-to-code foundation within the selected scope. In `full`, consider:

- framework and runtime structure;
- source, test, asset, configuration, and documentation layout;
- package/dependency management;
- local development and build configuration;
- user-requested detailed configuration;
- format, lint, type, test, build, and aggregate verification;
- smoke, integration, E2E, accessibility, security, or operational harnesses justified by journeys;
- product, architecture, engineering, operations, and contribution documentation;
- initial specifications;
- shared and companion-native instructions;
- skills, prompts, agents, hooks, MCP configuration, or CI only when they are the appropriate native
  mechanism and have a maintained purpose;
- minimal application code needed to prove the foundation runs.

Framework-generated files are allowed when the user selected that framework. Do not remove standard
framework structure merely to make the proposal look smaller.

### Retrofit

Preserve the established project. Focus on the AI ecosystem and propose engineering improvements
only when important to reliable companion work or explicitly requested. A formatter, linter, type
checker, test runner, aggregate verification command, CI check, or missing documentation may be
added when evidence shows its value and the user approves it.

Do not replace frameworks, reorganize working code, rewrite configuration for preference, or adopt
every catalog component. Surface ownership ambiguity and source-of-truth conflicts instead of
choosing silently.

### Audit

Remain read-only with respect to the target. Inspect, ask essential interpretive questions, and
report facts, findings, conflicts, risks, preservation needs, missing harnesses, and recommended
follow-up. Do not create proposal or specification files, initialize tools, install dependencies, or
run commands that mutate target or external state.

## Knowledge architecture

Create maintainable knowledge that supports decisions rather than unconditional templates.

### Ecosystem component knowledge

Cover the selection, evidence, value, risks, maintenance, and rejection conditions for:

- current documentation and source-of-truth maps;
- specifications and decision records;
- shared and path-specific instructions;
- skills, prompts, agents, hooks, plugins, and MCP configuration;
- manifests, dependency management, formatters, linters, type checkers, tests, builds, and CI;
- environment, run, debug, browser, data, migration, release, and operational harnesses;
- security, privacy, accessibility, reliability, performance, and cost checks where applicable.

### Technology and tool knowledge

Provide grounded guidance for the technologies DevCharter can confidently support. Each profile
records:

- reliable detection evidence;
- conventional authoritative files;
- common project structures;
- initialization and configuration considerations;
- native format/lint/type/test/build/run tooling;
- critical harness opportunities;
- frequent conflicts and unsafe assumptions;
- official documentation sources that must be checked when current behavior matters.

Initial profiles should preserve current v0 language awareness and prioritize representative common
stacks rather than pretending to cover every ecosystem. Unsupported or stale knowledge produces a
question or research task, not invented configuration.

### Harness knowledge

Define a harness as a repeatable way for a human or companion to establish state, perform an action,
observe the result, and determine success without relying on prior conversation. Guidance covers:

- setup and environment checks;
- development server and application run workflows;
- aggregate verification;
- unit, integration, E2E, browser, accessibility, migration, and release journeys;
- fixtures and safe test data;
- timeouts, cleanup, failure output, and reproducibility;
- when a documented manual check is more honest than automation.

## Templates and examples

Templates are recipes and examples, not mandatory output. The companion adapts them to accepted
project facts and preserves native tool conventions. Examples must not introduce stale versions,
fake commands, placeholder secrets, or generic AI scaffolding.

Include concise starting patterns for:

- project briefs and current documentation;
- parent and implementation specifications;
- repository instructions;
- skill authoring;
- verification matrices;
- proposal presentation;
- completion evidence.

## Implementation tasks

### B1. Rewrite Project Architect

Replace CLI-routing instructions with the full conversational workflow and five-input contract.

### B2. Align Specification Architect

Preserve its lifecycle and strengthen its role as the detailed-plan and implementation gate used by
Project Architect.

### B3. Build knowledge and selection guidance

Create the minimum ecosystem, technology, tool, and harness knowledge required by the accepted
scenarios. Record unsupported areas and source freshness requirements.

### B4. Create templates and scenarios

Add reusable recipes and representative new, retrofit, audit, failure, and overengineering cases.

### B5. Validate cross-source authority

Ensure skills, knowledge, templates, specs, and current docs reference one another without duplicated
or conflicting behavior.

## Acceptance criteria

1. Project Architect accepts and verifies all five required inputs.
2. Every mode and scope has clear behavior and negative boundaries.
3. Repository inspection precedes material questions and proposals.
4. Questions distinguish facts, decisions, assumptions, risks, and sensitive confirmations.
5. New/full guidance can produce a complete ready-to-code foundation with specific requested
   configuration and justified framework structure.
6. Retrofit guidance preserves established structure and proposes engineering tools only when
   important and approved.
7. Audit guidance produces no target or external mutation.
8. Proposals are reviewable, proportionate, evidence-backed, and explicit about rejected components.
9. Proposal approval creates one or more target Markdown draft specifications but cannot authorize
   implementation.
10. Specification approval is the implementation gate, and material deviations require renewed
    approval.
11. The methodology supports blocking and non-blocking capability failures without bypassing safety.
12. Sensitive actions receive immediate confirmation even when technically permitted.
13. Knowledge covers component selection and rejection rather than unconditional generation.
14. Harness guidance produces observable, repeatable verification tied to critical journeys.
15. Templates are adaptable, source-aware, and free of placeholder or stale facts.
16. Representative fixtures cover new, retrofit, audit, complex scaffolding, requested custom
    configuration, missing permissions, dangerous actions, and an unsupported technology.
17. No instruction routes users to removed CLI or runtime behavior.
18. Current documentation and shared skills remain consistent.

## Verification

- static instruction and reference checks;
- scenario reviews against every acceptance criterion;
- new/full walkthrough with a framework and non-default development configuration;
- retrofit walkthrough adding one justified engineering tool while preserving existing content;
- hostile audit no-write review;
- SDD split and lifecycle tests using one-file and multi-file detailed plans;
- permission failure and sensitive-confirmation scenarios;
- independent fresh-context review for overengineering, ambiguity, and missing harnesses.

## Completion gate

Do not mark SPEC-0002B `done` until the shared Project Architect and Specification Architect form one
coherent lifecycle, the knowledge and templates support all required scenarios, every criterion has
evidence, current docs contain no contradictory workflow, and an independent reviewer confirms that
the methodology is complete without becoming a universal project-management or product-generation
system.
