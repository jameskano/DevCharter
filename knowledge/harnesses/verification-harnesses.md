# Verification harnesses

A harness is a repeatable way for a human or companion to establish state, perform an action,
observe the result, and decide success without prior conversation. A tool, prompt, or test file is
not a harness unless those four parts are usable and maintained.

## Design a harness

Record:

1. purpose and the critical journey or risk it covers;
2. prerequisites and environment checks, without secret values;
3. deterministic setup, fixtures, and safe test data;
4. the authoritative command or documented manual action;
5. observable success and useful failure output;
6. timeout, cleanup, isolation, and repeatability expectations;
7. owner and documentation location.

Prefer the lowest-cost evidence that proves the behavior. Unit checks cover bounded logic;
integration checks cover boundaries; E2E or browser checks cover material journeys. Do not replace
a critical journey with many isolated tests. Use documented manual verification when automation
would be brittle, unsafe, unavailable, or more expensive than its maintained value.

## Common opportunities

- setup: required runtime/tool versions, dependency availability, and environment-name checks;
- development/debug: start the app/service, observe readiness, reproduce a failure with documented
  diagnostics, and stop it cleanly;
- aggregate verification: the repository's format, lint, type, test, and build authorities in a
  documented order with failures preserved;
- browser/accessibility: establish a known state, exercise a key interaction at relevant viewports,
  inspect console/network output, and record accessibility evidence when material;
- data/migration: isolated fixtures, forward behavior, failure/recovery, and cleanup without using
  production secrets or data;
- release/operations: build the release artifact, smoke the supported runtime, observe health, and
  document rollback or recovery where required.

Every run reports the exact command or action, actual result, timeout/failure, skipped checks and
reason, cleanup result, and limitations. A missing tool may be non-blocking only when the accepted
outcome remains provable by other approved evidence; otherwise it blocks the affected criterion.
