# DevCharter

**Build the smallest AI-assisted development system a repository actually needs.**

Current repository version: **0.2.0**.

DevCharter is an instruction-, knowledge-, skill-, and specification-driven tool used by an AI
coding companion. It inspects a target repository, proposes only justified improvements, and keeps
implementation behind explicit human approval. DevCharter has no product CLI, runtime package,
hosted service, or target-project dependency.

SPEC-0002A–E complete the static foundation, shared methodology, native routes, documentation,
release qualification, and Plan-mode proposal refinement. The [qualification
record](docs/release/companion-driven-qualification.md) contains no pending or blocked gate. Live
new/retrofit target execution is explicitly deferred to later user testing and is not represented
as completed qualification work.

## Start a DevCharter run

Clone DevCharter locally, or give the companion a GitHub URL it can actually read. Open the selected
[companion entrypoint](#native-setup), then provide these five inputs in one message:

1. **Mode:** `new`, `retrofit`, or `audit`.
2. **Scope:** `full`, `governance`, `engineering`, or `ai`.
3. **DevCharter location:** this folder or its GitHub repository URL.
4. **Target location:** the separate project folder or repository to examine.
5. **Initial context:** plain text and/or specification files describing the intended outcome and
   constraints.

Use a prompt such as:

```text
Use DevCharter in retrofit mode with full scope.
DevCharter: C:/tools/DevCharter
Target: C:/work/my-product
Initial context: Preserve the existing stack and improve only foundations justified by evidence.
```

The DevCharter and target locations may be anywhere the companion can read. Do not copy DevCharter
into the target or add it to the target's dependencies.

For `new` and `retrofit`, use a suitable native Plan mode when the selected host offers one and you
want a more thoroughly refined proposal. It supports read-only inspection, clarification,
iteration, and review before implementation. Otherwise, ordinary interactive conversation follows
the same workflow with no loss of lifecycle safety and no additional DevCharter mode.

The companion inspects first, asks every unresolved question that could materially change the
proposal over as many rounds as needed, and omits repository-answerable or immaterial questions.
The resulting native plan or conversational output is the DevCharter proposal, not the definitive
implementation specification. Approve it only to authorize target-local Markdown draft
specifications. Review and separately approve the applicable specification before implementation.
For `audit`, the final result is a findings report in conversation and no proposal, target write, or
external mutation.

## Native setup

| Companion | Native route | Separate-location setup |
|---|---|---|
| Codex | Root `AGENTS.md` and `.agents/skills` | Make DevCharter the primary folder and add or attach the target |
| Claude Code | `/devcharter:project-architect` from a local plugin | Start in the target with `--add-dir <devcharter-location>` and `--plugin-dir <devcharter-location>/companions/claude-code/plugin` |
| GitHub Copilot CLI | `/project-architect` from `.agents/skills` | Add `<devcharter-location>/.agents/skills` to `COPILOT_SKILLS_DIRS` |
| Copilot IDEs | `/devcharter` prompt file | Preview-only in VS Code, Visual Studio, and JetBrains with both locations readable |

Read the selected companion entrypoint for exact setup and limitations. Host permission never
replaces proposal approval, specification approval, or immediate confirmation for sensitive
actions. Use a strong reasoning model for discovery, proposal synthesis, architecture, and detailed
planning. A faster or cheaper model can implement a precise low-risk approved plan when verification
is strong; this advice is provider-neutral.

Host availability, versions, policies, permissions, network access, and model quality can limit a
run. A companion must report a limitation or blocker accurately; DevCharter does not promise
deterministic output parity among providers or reliable results from every model.

## Next instruction source

1. Read the native entrypoint for the selected companion:
   [Codex](companions/codex/README.md), [Claude Code](companions/claude-code/README.md), or
   [GitHub Copilot](companions/github-copilot/README.md). Other capable companions may follow the
   [generic shared foundation](knowledge/shared-foundation.md) and the
   [Project Architect skill](.agents/skills/project-architect/SKILL.md) directly on a best-effort
   basis, with no support or output-quality guarantee.
2. Use the [Project Architect skill](.agents/skills/project-architect/SKILL.md) for `new`, `retrofit`,
   or `audit`.
3. After a new/retrofit proposal is explicitly approved, use the
   [Specification Architect skill](.agents/skills/specification-architect/SKILL.md) to create or
   refine the detailed implementation specification. Implementation still requires separate
   approval of that specification.

`audit` is read-only. For `new` and `retrofit`, proposal approval permits detailed specification
work; it does not permit implementation. Destructive actions, secret access, external data sharing,
remote writes, and hard-to-reverse operations always require immediate confirmation.

An approved Markdown specification is durable planning state. Implementation may continue in the
same conversation, or a later conversation can re-read the repository instructions, specification
status, relationships, approval metadata, and current worktree before moving one `ready` spec to
`active`. No transcript or DevCharter session store is required. Stale, conflicting, missing, or
unverifiable approval evidence returns the affected work to review.

## Repository map

- `AGENTS.md` — repository-wide authority and contributor rules.
- `.agents/skills/` — shared Project Architect and Specification Architect procedures.
- `companions/` — native companion entrypoints and host-specific setup.
- `knowledge/` — shared principles plus component, technology, command, and harness guidance.
- `templates/` — optional, source-aware recipes used only when evidence justifies an artifact.
- `tests/fixtures/` and `tests/scenarios/` — development-only methodology scenario evidence.
- `docs/` — current product, architecture, engineering, and historical release documentation.
- `specs/` — current authority and retained historical specifications.
- `references/` — dated official capability evidence for each supported companion.

The [manifest](MANIFEST.md) defines reading order and authority. The
[user guide](docs/user-guide.md) describes the current interaction model.
The [contributor guide](CONTRIBUTING.md) explains safe maintenance and qualification.

## Contributor verification

Node.js 22 or later is used only for repository asset checks; it is not a DevCharter product
runtime and is never installed in a target project.

```bash
npm run verify
git diff --check
```

`npm run verify` checks skill metadata, specification identity and status placement, relative
Markdown references, current-documentation runtime drift, native companion placement and semantic
routing, capability records, integration failure scenarios, the separate-location fixture and clean
temporary walkthrough, whitespace, secret signatures, and generated-output absence. It uses only
Node.js built-ins and has no install step or dependency lockfile.

## Product boundaries

DevCharter is not a CLI, agent runtime, hosted service, task manager, session store, marketplace,
provider router, policy server, or universal governance framework. It does not generate agents,
hooks, integrations, CI, or tooling without repository evidence and approval.

Historical v0 specifications and qualification records remain available as evidence, not current
product authority. See the [v0 migration map](docs/architecture/v0-migration-map.md).

## License

A legal license has not yet been selected. Until one is added, the repository does not grant the
standard permissions normally provided by an open-source license.
