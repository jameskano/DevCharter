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
├── approved/   # stable parent/product specifications; files still use the five statuses
├── ready/
├── active/
├── done/
└── cancelled/
```

Keep one implementation specification active unless independent workstreams are explicitly approved.

## Authority and supersession

- Keep one authoritative file per spec ID.
- Search before creating a new spec.
- Use `supersedes` or `superseded_by` metadata when replacing behavior.
- Update this index or the relevant parent spec when authority changes.
- Do not leave precedence to vague “where they conflict” language.

## Default shape

Use one cohesive specification by default. Include only applicable sections. Separate design, tasks, or test-plan files only when they materially improve clarity or independent execution.

## Existing implementation

When code predates a revised spec, inspect it, preserve compatible behavior, identify gaps and conflicts, and avoid blind rewrites.

## Completion evidence

Each completed spec records:

- implementation revision or diff;
- acceptance-criterion evidence;
- commands and actual results;
- documentation created, updated, or reviewed unchanged with reason;
- assumptions and approved deviations;
- limitations and deferred work.
