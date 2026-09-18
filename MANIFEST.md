# DevCharter specification-pack manifest

## Purpose

This pack contains the complete project-level Markdown context needed for Codex to build DevCharter without relying on the original design conversation.

Imported repositories and local example folders informed this revision, but their instructions are not authoritative for DevCharter. Only the files in this pack and the target DevCharter repository govern implementation.

## Reading order

1. `AGENTS.md`
2. `docs/product/purpose-and-scope.md`
3. `docs/architecture/system-overview.md`
4. `docs/engineering/quality-and-decision-model.md`
5. `docs/engineering/spec-driven-workflow.md`
6. `specs/README.md`
7. `specs/approved/SPEC-0002-companion-driven-devcharter.md`
8. the current active SPEC-0002 implementation specification and its ready dependencies
9. `specs/ready/SPEC-0002A-repository-transformation-and-shared-foundation.md`
10. `specs/ready/SPEC-0002B-project-architect-methodology-and-knowledge.md`
11. `specs/ready/SPEC-0002C-native-companion-integrations.md`
12. `specs/ready/SPEC-0002D-qualification-documentation-and-release-transition.md`
13. `specs/approved/SPEC-0001-devcharter-v0.md` only for historical v0 context
14. `specs/done/SPEC-0001A-core-foundation-and-canonical-model.md`
15. `specs/done/SPEC-0001B-project-architect-workflow.md`
16. `specs/done/SPEC-0001C-specification-architect.md`
17. `specs/done/SPEC-0001D-ecosystem-generator-and-codex-adapter.md`
18. `specs/done/SPEC-0001E-validation-and-release-readiness.md`
19. applicable current capability references

## Historical v0 context

The repository and its recoverable Git history contained no donor implementation when SPEC-0001
was approved. The TypeScript v0 runtime was therefore a clean-slate implementation of that now
superseded architecture. Its completed specifications and Git history remain evidence, not current
product contracts or compatibility requirements.

## Current design decisions

- Modes remain `new`, `retrofit`, and `audit`.
- Scopes remain `full`, `governance`, `engineering`, and `ai`.
- Statuses remain `draft`, `ready`, `active`, `done`, and `cancelled`.
- The selected AI coding companion is the interface; there is no DevCharter CLI, product runtime,
  JSON lifecycle, persisted session system, or target-local DevCharter dependency.
- Each run begins with mode, scope, DevCharter location, target location, and initial input.
- New and retrofit require proposal approval, followed by one or more Markdown SDD specifications
  and separate plan approval before implementation.
- Audit is read-only.
- Artifacts are created only when project evidence or an accepted user decision justifies them;
  complete does not mean unconditional generation.
- DevCharter source remains separate from and read-only during work on the target.
- Codex, Claude Code, and GitHub Copilot receive native integrations backed by one shared
  methodology.
- Validation covers reference integrity, provenance, authority, preservation, scope, safety,
  companion routing, and representative end-to-end journeys without claiming deterministic model
  output.

## Status transitions

```text
draft → ready → active → done
draft|ready|active → cancelled
```

Blocking is metadata and does not create another lifecycle state.

## Current product evolution

`SPEC-0002` makes the AI coding companion the DevCharter interface while retaining the three modes,
four scopes, explicit proposal and specification approvals, minimum-sufficient generation, and
read-only audit. It removes the CLI, three v0 runtime packages, JSON lifecycle, and deterministic
renderer/writer. SPEC-0002 is approved product authority; SPEC-0001 and SPEC-0001A–E are historical.

SPEC-0002A–D are approved and ready in dependency order. Approval does not activate implementation;
one child must be explicitly moved to `active` before its implementation begins.
