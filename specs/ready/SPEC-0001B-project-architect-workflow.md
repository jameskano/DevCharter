# SPEC-0001B — Project Architect Workflow

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0001B |
| Parent | SPEC-0001 |
| Status | ready |

## Purpose

Implement the main DevCharter workflow for creating, improving, or auditing a repository's AI-assisted development ecosystem.

## Public commands

```bash
devcharter new [--scope full|governance|engineering|ai]
devcharter retrofit [--scope full|governance|engineering|ai]
devcharter audit [--scope full|governance|engineering|ai]
```

All modes default to `full`. There is no `check` command.

## New

Use for an empty or lightly initialized repository.

New must:

1. inspect the directory before asking questions;
2. detect meaningful implementation or governance already present;
3. recommend retrofit when the repository is materially established;
4. gather intended outcome, selected technologies/tools, constraints, and important risks;
5. produce the smallest useful proposal;
6. wait for explicit approval;
7. delegate approved application to 0001D;
8. validate and report.

## Retrofit

Use for an existing repository.

Retrofit must preserve useful conventions and user-owned content while finding gaps, broken references, conflicting or superseded sources, redundant AI material, missing verification, unsafe generation history, and unjustified complexity.

It proposes targeted changes and may recommend removing or consolidating material, but it never deletes or replaces it without approval.

## Audit

Audit is read-only at the filesystem boundary.

It reports:

- findings and evidence;
- confidence and uncertainty;
- missing, conflicting, obsolete, or overlapping elements;
- broken paths, commands, or instruction routing;
- source-of-truth and spec-precedence problems;
- unnecessary components;
- verification and journey gaps;
- recommended follow-up.

Audit never creates configuration, receipts, sessions, caches inside the repository, or modified timestamps attributable to DevCharter.

## Scopes

### Full

Union of governance, engineering, and AI.

### Governance

Project truth, architecture/feature documentation, specs, decisions, assumptions, status/precedence, and documentation synchronization.

### Engineering

Repository layout, runtime, package manager, commands, formatting, linting, typing, tests, CI, security checks, environment conventions, and relevant operations.

### AI

Root and nested instructions, skills, tool-specific configuration, prompts or agents already present, hooks, MCP integrations, permissions, and evaluations—without assuming that any of them are required.

Cross-cutting qualities are considerations within the selected scope, not more scopes.

## Discovery pipeline

### 1. Inventory

Recursively enumerate repository paths while applying explicit safe ignores for dependency directories, caches, build output, binary assets, and generated/vendor content.

Do not claim to have semantically reviewed every source file merely because every path was enumerated.

### 2. Classify

Classify relevant artifacts by kind, origin, ownership, native tool target, and likely authority.

Distinguish project-authored skills from installed third-party skill packages and preserve available lock/provenance information.

### 3. Inspect relevant sources

Inspect, as applicable:

- manifests, workspace files, runtime/tool versions, and scripts;
- repository structure and representative implementation;
- docs, specs, decisions, and indexes;
- tests, test helpers, E2E flows, and CI;
- root/nested AI instructions, skills, prompts, agents, hooks, MCP/configuration;
- existing generated-file metadata;
- Git status and relevant current changes.

### 4. Build evidence-backed facts

Each material inferred fact identifies its evidence and confidence. Shallow heuristics such as “no conventional test directory means no tests” are insufficient.

### 5. Map authority and references

Identify:

- source of truth per concern;
- duplicate or conflicting instructions;
- superseded specifications;
- referenced files, commands, and paths that do not exist;
- documented commands that disagree with package scripts or CI;
- AI mechanisms that are not native to the selected tool and lack explicit routing.

### 6. Identify journeys

Determine the critical developer workflows and, when relevant, user journeys that verification must protect.

### 7. Ask only unresolved questions

Questions must materially affect desired behavior, architecture, risk, or output. Include the detected context and a recommended default when appropriate.

## AI classification

Do not conflate:

- developer-AI configuration;
- runtime/product AI implementation;
- unused AI dependencies;
- future AI scope mentioned in docs/specs;
- generic uses of words such as “prompt.”

## Proposal contract

Every proposal includes:

- proposal revision and repository fingerprint;
- mode and scope;
- detected facts with evidence and confidence;
- intended target state;
- findings, assumptions, open questions, and conflicts;
- critical journeys;
- components considered and rejected;
- planned files classified as create/update/skip/conflict;
- files explicitly preserved;
- ownership/provenance implications;
- dependencies and maintenance cost;
- risk and validation plan;
- deferred work.

Every proposed artifact explains why it exists. “Best practice” alone is not sufficient.

## Approval

New and retrofit cannot write without explicit approval of the current proposal revision.

If relevant repository state changes materially after approval, invalidate or refresh only the affected proposal portions and request approval again.

Audit requires no write approval because it cannot write.

## Output

Human and JSON outputs include mode, scope, summary, facts, findings, assumptions, questions, considered/rejected components, planned/applied changes, conflicts, validation, and deferred work.

## Idempotency expectations

- Retrofit does not duplicate files or content.
- New does not initialize twice.
- Audit does not change state.
- Reapplying an unchanged approved proposal is a verified no-op or fails safely as stale.

## Non-goals

- Persisted sessions.
- General task tracking.
- Specification content owned by 0001C.
- File rendering and application owned by 0001D.
- Release qualification owned by 0001E.
- Automatic full-repository semantic rescanning on every small task.

## Acceptance criteria

1. New, retrofit, and audit exist with exactly four scopes.
2. Audit is proven read-only and creates no repository state.
3. Discovery enumerates deeply while distinguishing enumeration from semantic inspection.
4. Generated/vendor/cache and third-party material are classified rather than treated as project truth.
5. Important facts include evidence and confidence.
6. Source-of-truth, spec precedence, broken references, and command/CI inconsistencies are detected.
7. Developer-AI and runtime/product AI are distinguished.
8. Installed and project-authored skills can be distinguished when evidence exists.
9. Questions are minimal, material, and context-aware.
10. Proposals contain create/update/skip/conflict decisions and rejected components.
11. Every proposed artifact has a repository-specific reason and maintenance implication.
12. New and retrofit require approval of the current proposal revision.
13. Material repository changes invalidate affected approval.
14. Existing content is preserved by default.
15. Results support stable human and JSON formats.
16. Tests cover modes, scopes, discovery classification, approvals, audit, stale proposals, and idempotency.
