# Codex prompt — implement the active specification

Use this only after the current spec is active and its plan is approved.

```text
Read AGENTS.md, MANIFEST.md, the parent SPEC-0001, the active specification, the approved implementation plan, and every directly referenced document.

Before editing:

1. Inspect current Git state and relevant uncommitted changes.
2. Confirm exactly one applicable implementation spec is active.
3. Confirm the approved plan and repository state still match.
4. Report conflicts, stale assumptions, or blocking questions.
5. Restate the implementation phases and acceptance-criterion mapping.

Implement only the active specification.

During work:

- preserve compatible existing behavior and user changes;
- make small cohesive changes;
- add tests with behavior changes;
- keep code, specs, current docs, and AI instructions synchronized;
- search before creating new abstractions, files, or dependencies;
- keep generated artifacts minimum-sufficient;
- do not implement later-spec scope;
- do not weaken acceptance criteria or validation to make tests pass;
- record assumptions, deviations, partial failures, and deferred work.

Use targeted verification after cohesive changes. Broaden verification when shared contracts, schemas, filesystem behavior, CLI behavior, adapters, or critical journeys are affected.

At completion:

1. Run applicable format, lint, type-check, test, build, and DevCharter validation commands.
2. Record actual results and skipped checks with reasons.
3. Map every acceptance criterion to implementation and verification evidence.
4. List documentation created, updated, or reviewed unchanged with reason.
5. Confirm no unnecessary later-spec behavior was introduced.
6. List limitations, unresolved risks, and deferred work.
7. Present a reviewable final diff.
8. Do not mark the spec done; request an independent completion review first.
```
