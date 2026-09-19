# DevCharter

**Build the smallest AI-assisted development system a repository actually needs.**

DevCharter is an instruction-, knowledge-, skill-, and specification-driven tool used by an AI
coding companion. It inspects a target repository, proposes only justified improvements, and keeps
implementation behind explicit human approval. DevCharter has no product CLI, runtime package,
hosted service, or target-project dependency.

SPEC-0002A establishes this shared static foundation. The complete Project Architect methodology
and the native Codex, Claude Code, and GitHub Copilot integrations are intentionally deferred to
SPEC-0002B and SPEC-0002C.

## Start a DevCharter run

Open DevCharter from a local folder or GitHub repository, then tell your AI coding companion these
five inputs:

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

## Next instruction source

1. Read the entrypoint for the selected companion:
   [Codex](companions/codex/README.md), [Claude Code](companions/claude-code/README.md), or
   [GitHub Copilot](companions/github-copilot/README.md). Other capable companions may follow the
   [generic shared foundation](knowledge/shared-foundation.md) on a best-effort basis.
2. Use the [Project Architect skill](.agents/skills/project-architect/SKILL.md) for `new`, `retrofit`,
   or `audit`.
3. After a new/retrofit proposal is explicitly approved, use the
   [Specification Architect skill](.agents/skills/specification-architect/SKILL.md) to create or
   refine the detailed implementation specification. Implementation still requires separate
   approval of that specification.

`audit` is read-only. For `new` and `retrofit`, proposal approval permits detailed specification
work; it does not permit implementation. Destructive actions, secret access, external data sharing,
remote writes, and hard-to-reverse operations always require immediate confirmation.

## Repository map

- `AGENTS.md` — repository-wide authority and contributor rules.
- `.agents/skills/` — shared Project Architect and Specification Architect procedures.
- `companions/` — companion entrypoints; native integrations are completed by SPEC-0002C.
- `knowledge/` — shared principles extracted from the historical v0 implementation.
- `templates/` — optional guidance used only when evidence justifies the artifact.
- `tests/fixtures/` and `tests/scenarios/` — development-only static scenario evidence.
- `docs/` — current product, architecture, engineering, and historical release documentation.
- `specs/` — current authority and retained historical specifications.
- `references/` — dated external-capability evidence.

The [manifest](MANIFEST.md) defines reading order and authority. The
[user guide](docs/user-guide.md) describes the current interaction model.

## Contributor verification

Node.js 22 or later is used only for repository asset checks; it is not a DevCharter product
runtime and is never installed in a target project.

```bash
npm run verify
git diff --check
```

`npm run verify` checks skill metadata, specification identity and status placement, relative
Markdown references, current-documentation runtime drift, companion routing, the separate-location
scenario fixture and clean temporary walkthrough, whitespace, secret signatures, and generated-output
absence. It uses only Node.js built-ins and has no install step or dependency lockfile.

## Product boundaries

DevCharter is not a CLI, agent runtime, hosted service, task manager, session store, marketplace,
provider router, policy server, or universal governance framework. It does not generate agents,
hooks, integrations, CI, or tooling without repository evidence and approval.

Historical v0 specifications and qualification records remain available as evidence, not current
product authority. See the [v0 migration map](docs/architecture/v0-migration-map.md).

## License

A legal license has not yet been selected. Until one is added, the repository does not grant the
standard permissions normally provided by an open-source license.
