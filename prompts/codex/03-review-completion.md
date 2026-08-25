# Codex prompt — independent completion review

Start read-only. Do not fix findings unless explicitly asked after the report.

```text
Read:

- AGENTS.md
- MANIFEST.md
- SPEC-0001
- the active specification and approved plan
- implementation diff and changed-file list
- relevant source files and tests
- command output and validation evidence
- affected current documentation

Review in this order:

1. Convert every acceptance criterion into a checklist.
2. Map each criterion to implementation and test/manual evidence.
3. Verify actual behavior, not only file presence.
4. Check scope drift and unintended later-spec work.
5. Check source-of-truth, documentation, and instruction drift.
6. Check that compatible existing behavior and user-owned content were preserved.
7. Check failure, conflict, idempotency, and negative-requirement behavior where applicable.
8. Check whether targeted and broad verification match the change risk.
9. Confirm commands/results are accurate and limitations are explicit.
10. Decide whether the spec is eligible for done.

Return findings first:

- Blocking: criterion failure, unsafe behavior, data loss, audit write, or untrustworthy evidence.
- Important: user-visible mismatch, meaningful regression risk, missing important test, or source-of-truth conflict.
- Advisory: low-risk clarity or maintenance improvement.

Include:

| Acceptance criterion | Implementation evidence | Verification evidence | Result |
|---|---|---|---|

Then report:

- missing tests or journey evidence;
- scope/spec/documentation drift;
- skipped commands and residual risk;
- final verdict: PASS, PASS WITH FIXES, or FAIL;
- recommendation on moving the spec to done.

Do not recommend done while blocking or required important findings remain.
```
