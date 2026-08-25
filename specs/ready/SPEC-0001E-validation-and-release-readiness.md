# SPEC-0001E — Validation and Release Readiness

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0001E |
| Parent | SPEC-0001 |
| Status | ready |

## Purpose

Prove that DevCharter can safely create, retrofit, and audit realistic repositories and that the resulting ecosystem supports complete developer journeys before v0 is stable.

## Validation layers

### Unit

Cover records/schemas, exact modes/scopes/statuses, evidence/confidence, path safety, artifact classification, ownership/provenance, proposal revision, change actions, stable rendering, and validation results.

### Integration

Cover CLI commands, discovery, approval gates, stale proposal handling, rendering, atomic writes, human/JSON output, offline operation, and partial failure reporting.

### Repository fixtures

Use the smallest realistic repository for each behavior. Fixtures may be intentionally incomplete or inconsistent.

Required fixture conditions include:

- empty or lightly initialized project;
- existing well-configured project;
- conflicting or duplicated instructions;
- broken references and renamed commands;
- nested `AGENTS.md` files;
- project-authored and third-party skills with provenance;
- AI-heavy repository with overlapping prompts, agents, and skills;
- superseded specs with unclear authority;
- CI and local verification mismatch;
- developer-AI configuration alongside deferred runtime/product AI;
- existing user-owned files and manually changed managed files;
- small monorepo.

Do not embed an unrelated maintained application as a test fixture.

### End-to-end

Required DevCharter journeys:

1. New full: discover, ask, propose, approve, apply, validate.
2. New AI-only with minimal output.
3. Retrofit full preserving useful content.
4. Retrofit AI-only consolidating unnecessary overlap.
5. Read-only audit with verified zero repository writes.
6. Specification creation, approval, implementation, independent review, documentation update, and done evidence.
7. Repeated unchanged run producing no material diff.

### Negative requirements

Tests must prove that DevCharter does not:

- create sessions or expose `check`;
- generate unjustified agents, skills, prompts, hooks, MCP, CI, or infrastructure;
- duplicate sections on repeated runs;
- treat vendor/generated files as project truth;
- conflate runtime AI with developer AI;
- write during audit;
- overwrite user content silently;
- claim successful rollback or validation without evidence.

## Verification tiers

DevCharter-generated recommendations distinguish:

- targeted checks for the changed behavior;
- broad local verification;
- integration/E2E checks;
- manual or external-system checks.

Audit detects when docs, package scripts, PR templates, and CI disagree about these tiers.

## Failure safety

Test malformed YAML, path traversal, write failure, invalid or stale approval, repository changes after approval, merge conflicts, managed-file drift, unavailable commands, failing validation, and partial application.

## Security and privacy

Test offline core operation, no telemetry, no secret copying, no conversation persistence, safe permissions, repository-root containment, and audit write prohibition.

## Habit Compass external pilot

Before stable release, run audit and then an approved retrofit proposal against Habit Compass in a separate branch and repository.

The pilot must demonstrate that DevCharter can detect or correctly assess:

- documentation pointing to `.ai/skills` while skills exist under `.agents/skills`;
- overlap across root instructions, project agents, prompts, workflows, and skills;
- project-authored versus installed third-party skills and available lock provenance;
- unclear spec supersession or competing behavior sources;
- differences between documented verification, package scripts, PR checks, and CI;
- many isolated tests versus coverage of complete critical journeys;
- product AI deliberately deferred while developer-AI infrastructure exists;
- components that should be preserved rather than regenerated.

The pilot does not live inside DevCharter's test tree and must not be modified without an approved proposal.

## Release criteria

1. Specs 0001A–E are done with evidence.
2. Required unit, integration, fixture, E2E, and safety tests pass.
3. Audit read-only behavior is proven at the filesystem boundary.
4. New and retrofit proposal gates and stale-approval behavior are proven.
5. Codex adapter works in a fresh clone using official native paths.
6. Idempotency and negative requirements are proven.
7. Failure and partial-application reporting is accurate.
8. Habit Compass pilot is complete with findings and usability notes.
9. Limitations and future adapter work are documented.

## Acceptance criteria

1. All validation layers exist and map to parent criteria.
2. Every mode and scope has representative coverage without a combinatorial test matrix.
3. Critical DevCharter journeys pass end to end.
4. Negative requirements prove unnecessary artifacts are not generated.
5. Audit produces no repository writes or state.
6. New and retrofit are proposal-gated and stale approval is rejected.
7. Repeated unchanged application is a verified no-op.
8. Existing user files and third-party provenance are preserved.
9. Conflict, drift, broken reference, and command/CI mismatch behavior is tested.
10. Security, privacy, and path-containment requirements are tested.
11. Codex adapter output uses official native layout in a fresh repository.
12. Habit Compass pilot validates the real-world audit cases listed above.
13. Release evidence records actual commands, results, limitations, and deferred work.
