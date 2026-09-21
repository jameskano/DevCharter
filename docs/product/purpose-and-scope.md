# DevCharter purpose and scope

## Problem

AI coding companions work best when a repository has reliable project context, clear behavior
specifications, relevant instructions, and practical verification. Repositories often lack those
foundations or accumulate overlapping prompts, agents, skills, documentation, and commands.

## Purpose

DevCharter guides an AI coding companion to discover, propose, create, or improve the minimum useful
AI-assisted development ecosystem for a software repository. The companion reads DevCharter from a
local folder or GitHub repository while working on a separately identified target.

DevCharter is static: instructions, knowledge, skills, specifications, optional templates, scenarios,
and development-only checks. It has no user-facing CLI, runtime package, hosted service, session
store, or target-project dependency.

## Product principles

1. Inspect before asking or creating.
2. Prefer the minimum sufficient ecosystem.
3. Preserve useful existing conventions and unrelated work.
4. Keep one source of truth per concern.
5. Use native companion mechanisms where justified.
6. Propose before detailed planning; approve the detailed specification before implementation.
7. Keep audit read-only.
8. Treat specifications, implementation, tests, and current documentation as connected.
9. Validate critical journeys, not only isolated files.
10. Report uncertainty, limitations, failures, and partial progress accurately.

## Modes

- `new` — for an empty or lightly initialized target.
- `retrofit` — for an established target whose useful content must be preserved.
- `audit` — a read-only assessment with no proposal or target mutation.

## Scopes

- `full` — governance, engineering foundations, and AI ecosystem.
- `governance` — project truth, decisions, documentation, specifications, and authority.
- `engineering` — structure, developer commands, tests, CI, and relevant operational foundations.
- `ai` — instructions, supported skills, and justified companion configuration.

Architecture, correctness, maintainability, reliability, security, privacy, accessibility,
performance, cost, and operations are considerations within applicable scopes, not more scopes.

## AI classification

Discovery distinguishes developer-AI instructions, runtime/product AI behavior, unused AI-related
dependencies, future ideas, and third-party tooling. A name or dependency alone does not establish
runtime AI behavior.

## Primary user

A solo developer or small team using Codex or another AI coding companion who wants dependable
repository foundations without designing an instruction and governance system from scratch.

## Possible outputs

Depending on evidence and approval, work may create or improve repository instructions, current
documentation, specifications, relevant skills, native companion configuration, project
configuration, verification commands, tests, or CI. Existing adequate files may be preserved with
no new output.

## Non-goals

DevCharter is not a hosted service, agent runtime, project manager, session or memory database,
provider router, policy server, worktree manager, marketplace, pull-request writer, autonomous
product owner, or continuous repository monitor.

## Current implementation status

SPEC-0002A provides the static repository foundation and removes the historical v0 runtime.
SPEC-0002B provides the shared Project Architect methodology and knowledge. SPEC-0002C provides
qualified native Codex, Claude Code, and GitHub Copilot routes plus dated capability evidence;
SPEC-0002D completes documentation and release qualification with recorded supported-host evidence,
an approved Claude entitlement limitation, and scenario evidence for live new/retrofit journeys
deferred to later user testing.
