# DevCharter system overview

## Architecture

```text
DevCharter folder or GitHub repository (read-only during target work)
  |-- root entrypoint and repository instructions
  |-- shared Project Architect / Specification Architect skills
  |-- shared knowledge and optional templates
  |-- companion-specific routing
  `-- development-only static checks and scenarios
                         |
                         v
Selected AI coding companion
                         |
                         v
Separate target repository
  |-- discovery and questions
  |-- reviewable proposal
  |-- approved Markdown specification(s)
  `-- approved implementation and verification
```

The companion is the interface. DevCharter defines no product executable, runtime packages, JSON
lifecycle, deterministic renderer or writer, hosted service, or target-local installation path.

## Authority boundaries

- `AGENTS.md` and current specifications constrain repository development.
- The Project Architect skill routes `new`, `retrofit`, and read-only `audit` work.
- The Specification Architect skill owns detailed specification creation and review.
- Shared knowledge records implementation-neutral discovery, authority, preservation, approval,
  safety, and verification rules.
- Templates are optional guidance and cannot justify output by themselves.
- The companion integration contract and native entrypoints translate routing without duplicating
  shared authority; provider capability records contain refreshable host facts.
- Scenario fixtures, the acceptance matrix, and the validator are contributor-only qualification
  assets; they never enter a target.

## Target isolation

Every run names both a DevCharter location and a target location. They may be unrelated local paths
or repositories. During target work the DevCharter source is read-only, and DevCharter is not copied
into dependency manifests or installed as a target tool. A companion must report when it cannot read
the source or write the approved target rather than inventing a workaround.

## Lifecycle

For `new` and `retrofit`:

```text
inputs -> inspect -> resolve material questions -> proposal -> human approval
       -> draft detailed specification(s) -> human approval -> implement -> verify
```

Proposal approval authorizes specification drafting only. A material implementation deviation
updates the specification and requires renewed approval. `audit` ends with findings and performs no
target write, installation, mutating command, or state creation.

## Repository structure

The [manifest](../../MANIFEST.md) maps current authority. The static foundation deliberately contains
only consumed paths. SPEC-0002B supplies the detailed shared methodology, component and stack
selection knowledge, harness guidance, adaptable recipes, and methodology scenarios. SPEC-0002C
adds thin Codex, Claude Code, and GitHub Copilot discovery surfaces over those shared sources;
SPEC-0002D completes scenario, supported-host, documentation, migration, and release qualification.

## Qualification architecture

Qualification has four deliberately separate evidence classes:

- static checks validate DevCharter-owned structure, references, metadata, terminology, and native
  routes;
- scenario walkthroughs validate decisions, approval order, preservation, scope, and observable
  effects without requiring deterministic model prose;
- real-host records capture provider and host version or date, the five inputs, approvals, outputs,
  actual commands, limitations, and manual observations;
- a fresh-context reviewer checks the completed repository and evidence without relying on the
  implementation conversation.

The root Node script is only the first two classes. It stages bounded temporary source and target
directories to prove routing and hostile-audit snapshot equality, then removes them. It is not an
installer, renderer, or writer. Live new/retrofit target execution is deferred to later user
testing; supported-host evidence is recorded separately rather than inferred from the script.

## Historical architecture

The removed TypeScript core, Codex adapter, CLI, JSON lifecycle, renderer, writer, fingerprints, and
package qualification were the superseded v0 implementation. Their specifications and release
records remain historical evidence. The [migration map](v0-migration-map.md) records the disposition
of every former source group.
