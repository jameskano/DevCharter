# DevCharter purpose and scope

## Problem

AI coding tools work best when a repository contains reliable project context, clear behavior specifications, relevant instructions, and deterministic ways to verify changes.

Repositories often begin without these foundations or accumulate disconnected prompts, agent roles, skills, documentation, and commands. More files can make the system less reliable when their responsibilities overlap or their references drift.

## Purpose

DevCharter provides a structured way to create or improve a repository's AI-assisted development ecosystem.

It discovers what already exists, asks only for material decisions it cannot infer, proposes the minimum useful improvements, applies approved changes safely, and verifies the result.

## Product principles

1. Inspect before asking or creating.
2. Prefer the minimum sufficient ecosystem.
3. Preserve useful existing conventions.
4. Keep one source of truth per concern.
5. Use native AI-tool mechanisms where available.
6. Propose before writing.
7. Make audit read-only.
8. Treat specifications, code, tests, and current documentation as connected.
9. Validate user and developer journeys, not only isolated files.
10. Make repeated runs safe and unsurprising.

## Modes

### New

For a new or lightly initialized project. DevCharter gathers intended outcome, chosen technologies, important constraints, and selected AI tools before proposing a small foundation.

### Retrofit

For an existing repository. DevCharter inventories code, documentation, specifications, commands, tests, CI, AI configuration, and relevant conventions; then proposes targeted improvements.

### Audit

For an existing setup. DevCharter performs a read-only review and reports missing, obsolete, overlapping, broken, conflicting, or unjustified elements.

## Scopes

### Full

Governance, engineering foundations, and AI ecosystem.

### Governance

Project truth, current-state documentation, specifications, accepted decisions, assumptions, spec precedence, and documentation synchronization.

### Engineering

Repository structure, runtime and package management, developer commands, formatting, linting, typing, tests, CI, safety checks, and operational foundations required for reliable development.

### AI

`AGENTS.md`, supported skills, tool-specific configuration, and other AI components only where evidence justifies them.

Architecture, correctness, maintainability, reliability, security, privacy, accessibility, user experience, performance, cost, and operations are considerations within applicable scopes, not more public scopes.

## AI classification

Discovery must distinguish:

- developer-AI instructions and workflows;
- runtime or product AI features;
- AI-related dependencies that may be unused;
- future AI ideas described only in specifications;
- third-party or installed skills and tooling.

Finding the word “AI” or an AI package is not enough to conclude that the product implements runtime AI.

## Primary user

A solo developer or small team using Codex or another AI coding tool who wants a dependable setup without manually designing an instruction and governance system.

## Possible outputs

Depending on need, a run may create or improve:

```text
AGENTS.md
docs/
specs/
.agents/skills/
.codex/
project configuration
verification commands
tests or CI
```

Not every project receives every component. Existing adequate files may be preserved with no new output.

## Non-goals

DevCharter v0 is not:

- a hosted service;
- an agent execution or orchestration runtime;
- a task board, issue tracker, or project manager;
- a session, memory, or vector database;
- a provider-routing or policy-enforcement service;
- a worktree, terminal, or sandbox manager;
- a prompt or skill marketplace;
- an automatic pull-request or protected-branch writer;
- an autonomous product owner;
- a continuous semantic repository monitor.

## Success

The resulting repository is easier for humans and AI to understand, safer to change, simpler to verify, less dependent on conversation history, and free from unnecessary AI scaffolding.
