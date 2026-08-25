# SPEC-0001D — Ecosystem Generator and Codex Adapter

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0001D |
| Parent | SPEC-0001 |
| Status | ready |

## Purpose

Render and safely apply the approved minimum-sufficient ecosystem proposed by the Project Architect.

Fully support Codex in v0 while keeping the analysis and proposal contracts model-neutral.

## Inputs

- approved current proposal revision;
- mode and scope;
- evidence-backed project facts;
- accepted decisions and constraints;
- current repository fingerprint/state;
- planned file changes;
- selected adapter;
- ownership, provenance, and merge information;
- validation plan.

## Planned file contract

Before writing, every target is represented as:

```text
path
action: create | update | skip | conflict
purpose
reason
origin/ownership
adapter
proposed content or diff
validation expectations
```

The user can review exactly what will happen.

## Minimum generation rule

Generate only approved artifacts that satisfy a detected current need.

DevCharter may conclude that:

- the existing setup is sufficient;
- an existing command should be reused;
- only `AGENTS.md` needs improvement;
- a spec convention is enough;
- no skill, agent, prompt, hook, MCP, CI, or new dependency is required.

The proposal records considered and rejected components.

## Governance output

Depending on scope and need, generate or improve concise current project context, an authoritative specs index, a cohesive feature-spec template, and the minimum documentation needed to make important behavior discoverable.

Do not create large empty directory trees, placeholder documents, or multiple policy/profile files without near-term use.

## Engineering output

Only when missing and justified, generate or improve:

- runtime or package-manager configuration;
- formatting, linting, or type checking;
- focused test foundations;
- build and verification commands;
- CI;
- security/dependency checks;
- environment examples;
- relevant operational documentation.

Every new harness states what it protects, how to run it, and its maintenance cost. Do not install deferred infrastructure “for later.”

## AI output

Depending on need:

- root or genuinely scoped nested `AGENTS.md`;
- Project Architect and Specification Architect skills;
- selected supported Codex configuration;
- other AI artifacts only when explicitly justified.

Do not generate a role-agent fleet or reusable prompt library by default. Historical one-off implementation prompts belong in specs or planning records rather than permanent project AI infrastructure.

## Codex adapter

The adapter follows official OpenAI documentation and may generate:

```text
AGENTS.md
nested AGENTS.md files when scope differs
.agents/skills/<skill-name>/SKILL.md
.codex/configuration only when officially supported and required
```

Rules:

- keep root instructions concise and durable;
- link to deeper project docs rather than copy them;
- put stable repeatable procedures in skills;
- use concise valid skill frontmatter and focused supporting resources;
- preserve third-party skill provenance;
- do not place project skills under an invented `.ai/skills` convention;
- do not generate `AGENTS.override.md` as ordinary permanent project setup;
- do not emit custom-agent formats unless current official Codex support and the approved proposal justify them.

## Existing-file strategy

For each existing target:

1. inspect content and origin;
2. identify the applicable source of truth;
3. classify ownership;
4. compare semantically, not only by file existence;
5. create a reviewable diff;
6. preserve useful project rules;
7. report unresolved conflicts;
8. require approval before replacement.

No silent overwrite and no repeated dated append sections.

## Ownership and drift

Starter documentation becomes project-owned after application unless the proposal explicitly marks a file as managed.

For managed files, a small receipt may store path, adapter, baseline hash, and managed state. If the current content diverges from the baseline, report drift and require a merge decision.

Generated-region markers are exceptional. Prefer whole-file ownership or semantic merging.

## Application safety

- Verify the approved proposal fingerprint before applying.
- Reject paths outside the repository root.
- Prepare all content before writes where practical.
- Use atomic replacement.
- Record exactly what changed.
- Stop safely on conflicts or invalid state.
- Never claim full rollback unless it was actually verified.
- Report partial application accurately.

## Idempotency

For unchanged inputs and repository state:

- the rendered plan is stable;
- a second application creates no material diff;
- no duplicate sections or files appear;
- existing adequate content remains skipped;
- audit-related code paths cannot invoke the writer.

## Future adapters

Define a small adapter contract for future Claude Code or GitHub Copilot support, but do not implement their full native surfaces in v0.

## Non-goals

- Hosted distribution or marketplace.
- Full multi-vendor implementation.
- Automatic external authorization.
- Protected-branch writes.
- Generic technology templates unrelated to detected need.
- Mandatory `.ai/` project profiles.
- Managed ownership of every generated starter file.

## Acceptance criteria

1. Generation consumes only an approved, current proposal revision.
2. Every target is planned as create/update/skip/conflict before writes.
3. Every generated artifact has a project-specific purpose and reason.
4. Empty documentation forests and unnecessary components are not generated.
5. Existing commands and conventions are reused when sufficient.
6. Codex output uses supported native instruction and skill paths.
7. `AGENTS.md` stays concise and detailed repeatable workflows live in skills.
8. Role-agent and prompt libraries are absent unless explicitly justified.
9. Third-party skill provenance is preserved.
10. Existing files are safely preserved, updated, skipped, or reported as conflicts.
11. Starter files become project-owned unless explicitly managed.
12. Managed-output receipts contain no secrets or conversation/session data.
13. Output is deterministic and repeated application is a no-op.
14. Audit paths are unable to write.
15. Partial failures and conflicts are reported accurately.
16. Tests cover new generation, retrofit merge, native Codex layout, stale approval, conflict, drift, idempotency, and failure safety.
