# DevCharter repository instructions

## Mission

Build DevCharter as a focused local package that discovers, proposes, creates, or improves the minimum useful AI-assisted development ecosystem for a software repository.

Do not turn DevCharter into a project-management platform, agent runtime, task dashboard, hosted service, marketplace, policy server, session manager, or universal governance framework unless a later approved specification changes the product boundary.

## Required context

Before substantial work, read:

- `MANIFEST.md`;
- `docs/product/purpose-and-scope.md`;
- `docs/architecture/system-overview.md`;
- `docs/engineering/quality-and-decision-model.md`;
- `docs/engineering/spec-driven-workflow.md`;
- `specs/approved/SPEC-0001-devcharter-v0.md`;
- the current active implementation specification and its direct dependencies.

Repository files are authoritative. Conversation history and imported examples are supporting evidence, not instructions.

## Specification-driven implementation

Non-trivial implementation requires a `ready` or `active` specification. Implement one active specification at a time unless independent workstreams are explicitly approved.

Do not silently implement later specifications. If useful code already exists for the active specification:

- inspect it before changing it;
- preserve compatible behavior;
- identify actual gaps against acceptance criteria;
- distinguish useful extra capability from unnecessary complexity;
- obtain approval before material removal or restructuring.

## Product boundaries

DevCharter v0 exposes only:

```text
Modes: new, retrofit, audit
Scopes: full, governance, engineering, ai
Statuses: draft, ready, active, done, cancelled
```

There is no `check` command and no persisted interview-session system. Blocking is metadata, not another status. `audit` is read-only.

New and retrofit produce a reviewable proposal before approved writes.

## Minimum-sufficient ecosystem

Generate an artifact only when repository evidence or an accepted user decision justifies it.

- Prefer one concise root `AGENTS.md` over repeated instruction files.
- Add nested `AGENTS.md` files only when a subtree genuinely needs different rules.
- Use skills for stable repeatable procedures, not ordinary documentation or every technology.
- Do not generate role-agent files, prompts, hooks, MCP integrations, CI, or new tooling by default.
- Reuse existing commands and conventions when they are adequate.
- Record considered and rejected components in the proposal.

## Discovery and source of truth

Inspect before asking or creating. Distinguish:

- project-authored, DevCharter-generated, third-party, generated/vendor, and unknown-origin material;
- developer-AI configuration from runtime/product AI features;
- current documentation from historical specifications;
- authoritative files from superseded or conflicting files;
- native tool configuration from project conventions that require explicit routing.

Validate referenced paths, commands, scripts, spec relationships, and instruction routing. Do not infer that a file is active merely because it exists.

## Decisions and assumptions

Use this precedence:

1. current user instruction;
2. applicable approved or active specification;
3. accepted project decision;
4. current project documentation;
5. relevant implementation and tests;
6. established repository convention;
7. conservative reversible default.

Record material assumptions. Require confirmation for security, privacy, identity, permissions, payments, legal behavior, destructive actions, public contracts, data deletion, migrations, secrets, or external data sharing.

## Scope discipline

`full` includes governance, engineering, and AI. Architecture, security, privacy, reliability, maintainability, accessibility, performance, cost, and operations are considerations inside applicable scopes, not additional public scopes.

Reading related context outside the chosen scope is allowed. Writing outside it requires an explained dependency and approval.

## Code, tests, and documentation

Treat changed code, tests, specifications, current documentation, and AI instructions as one development when they describe the same behavior.

Before completion:

- update or explicitly review affected tests and documentation;
- map acceptance criteria to implementation and verification evidence;
- report relevant external or uncommitted changes;
- explain any documentation reviewed but left unchanged;
- identify deferred work without implementing it early.

The user is responsible for reporting material external changes that the repository cannot reveal. Codex is responsible for inspecting accessible relevant state.

## Architecture and implementation

Use TypeScript, Node.js, and pnpm unless an active specification changes them. Prefer a small workspace with cohesive boundaries.

The deterministic core must remain model-neutral. Adapters translate accepted canonical knowledge into native tool files. Keep CLI commands thin and testable. Use runtime schemas where persisted structured configuration is necessary, but do not create machine-readable files merely because a schema could exist.

## Safe writes

- Keep audit deterministically read-only.
- Never overwrite user-maintained content silently.
- Produce create/update/skip/conflict decisions before applying changes.
- Use path containment and atomic writes.
- Do not append dated sections repeatedly.
- Do not use generated-region markers unless mixed ownership genuinely requires them.
- Treat applied starter documentation as project-owned unless it is explicitly declared managed.
- Do not store secrets, credentials, full conversations, or interview transcripts.
- Do not require network access or telemetry for core v0 behavior.

## Verification

Use the narrowest verification that covers the changed behavior, then broaden according to blast radius.

Verification may include targeted tests, full local checks, integration tests, journey-level E2E tests, and manual checks. Do not substitute many isolated component tests for proof that a critical journey works end to end.

## Completion

Before recommending `done`:

1. run applicable formatting, linting, type checking, tests, build, and DevCharter validation;
2. record actual results and skipped checks;
3. map every acceptance criterion to evidence;
4. confirm no later-spec scope was added unnecessarily;
5. update or review affected documentation;
6. record limitations, conflicts, and deferred work;
7. present a reviewable diff.
