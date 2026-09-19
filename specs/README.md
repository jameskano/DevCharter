# DevCharter specifications

## Statuses

Use only:

```text
draft
ready
active
done
cancelled
```

- `draft`: still being defined; implementation must not start.
- `ready`: explicitly approved and sufficiently complete to implement.
- `active`: implementation or completion verification is in progress.
- `done`: implementation, tests, documentation review, and acceptance evidence are complete.
- `cancelled`: work will not continue; retain its reason and relevant history.

Temporary blocking, review severity, and validation outcome are separate metadata, not statuses.

## Directories

```text
specs/
|-- draft/      # unapproved behavior; implementation must not start
|-- approved/   # stable parent/product specifications
|-- ready/
|-- active/
|-- done/
`-- cancelled/
```

Keep one implementation specification active unless independent workstreams are explicitly approved.

## Current specifications

- `approved/SPEC-0002-companion-driven-devcharter.md` — current approved product and architecture
  authority.
- `done/SPEC-0002A-repository-transformation-and-shared-foundation.md` — completed transformation
  from the v0 runtime to the shared static foundation.
- `done/SPEC-0002B-project-architect-methodology-and-knowledge.md` — completed shared conversational
  methodology, knowledge, templates, and harness guidance.
- `done/SPEC-0002C-native-companion-integrations.md` — qualified first-class Codex, Claude Code,
  and GitHub Copilot integrations.
- `ready/SPEC-0002D-qualification-documentation-and-release-transition.md` — end-to-end
  qualification, current documentation, and release transition.
- `approved/SPEC-0001-devcharter-v0.md` and `done/SPEC-0001A` through `SPEC-0001E` — superseded
  historical v0 authority and implementation evidence.

SPEC-0002A through SPEC-0002D are ordered implementation specifications. SPEC-0002A-C are done,
SPEC-0002D remains ready, and no implementation specification is active. Activate only the earliest
incomplete dependency unless an independent workstream is explicitly approved.

## Authority and supersession

- Keep one authoritative file per spec ID.
- Search before creating a new spec.
- Use `supersedes` or `superseded_by` metadata when replacing behavior.
- Update this index or the relevant parent spec when authority changes.
- Do not leave precedence to vague “where they conflict” language.

## Default shape

Use one cohesive specification by default. Include only applicable sections. Separate design, tasks,
or test-plan files only when they materially improve clarity or independent execution.

## Existing implementation

When implementation predates a revised spec, inspect it, preserve compatible behavior, identify gaps
and conflicts, and avoid blind rewrites.

## Completion evidence

Each completed spec records implementation or diff evidence, acceptance-criterion evidence, actual
verification results, documentation review, assumptions or approved deviations, limitations, and
deferred work.
