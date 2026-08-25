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
7. `specs/approved/SPEC-0001-devcharter-v0.md`
8. `specs/active/SPEC-0001A-core-foundation-and-canonical-model.md`
9. `specs/ready/SPEC-0001B-project-architect-workflow.md`
10. `specs/ready/SPEC-0001C-specification-architect.md`
11. `specs/ready/SPEC-0001D-ecosystem-generator-and-codex-adapter.md`
12. `specs/ready/SPEC-0001E-validation-and-release-readiness.md`
13. `references/official-codex-capabilities.md`
14. the appropriate prompt under `prompts/codex/`

## Clean-slate implementation

The repository and its recoverable Git history contain no donor implementation. DevCharter v0 therefore uses the product architecture and public contracts defined by this specification pack, with a clean-slate implementation.

No earlier public API or compatibility guarantee applies. If old code is recovered separately, assess it read-only before reuse. Recovery does not change the approved architecture or authorize transplantation automatically.

## Revised design decisions

- Modes remain `new`, `retrofit`, and `audit`.
- Scopes remain `full`, `governance`, `engineering`, and `ai`.
- Statuses remain `draft`, `ready`, `active`, `done`, and `cancelled`.
- There is no `check` command or persisted session system.
- One compact configuration is preferred over a collection of policy files.
- Artifacts are generated only when justified.
- Root instructions stay concise; repeatable procedures belong in skills.
- Codex-native paths and capabilities take precedence over conventions copied from other tools.
- Validation includes reference integrity, provenance, duplication, source-of-truth conflicts, idempotency, and end-to-end journeys.

## Status transitions

```text
draft → ready → active → done
draft|ready|active → cancelled
```

Blocking is metadata and does not create another lifecycle state.
