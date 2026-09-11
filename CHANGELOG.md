# Changelog

## Unreleased

### Added

- Composable decision and previous-proposal inputs for `new` and `retrofit`.
- Direct lifecycle-envelope support for `render` and `apply` while preserving bare artifact input.
- Deterministic repository-integrity and managed-output checks in `validate`.
- Production-only builds, local tarball inspection and fresh-install qualification for all three
  packages.
- Twelve release fixture conditions, seven built-CLI journeys, stable audit no-write evidence, and
  an exact retry no-op test.
- A four-job GitHub Actions matrix for Ubuntu/Node 22, Ubuntu/Node 24, Windows/Node 24, and
  macOS/Node 24.
- Compatible per-entry provenance recognition for canonical and installer-style version-1 skill
  locks without claiming unverified installer hashes as content-integrity evidence.

### Changed

- Raised the supported Node.js baseline from 20 to 22.
- Activated SPEC-0001E with its approved qualification, lifecycle, CI, documentation, and external
  pilot decisions.
- Excluded tests, test support, build information, repository prompts, specifications, and other
  development-only material from production package output.
- Made package qualification failures for unavailable commands, non-zero exits, and timeouts
  explicit and testable, and restricted installed skill-asset checks from reading the source checkout.
- Normalized text checkout to LF across platforms and allowed only the raw and canonical spellings
  of the bounded temporary installation during Node permission-model package checks.

### Deferred

- Registry publication, namespace reservation, publishing automation, and the legal license choice
  remain external release-administration decisions.
- Release readiness remains unclaimed until supported CI, independent specification review, and the
  separately approved Habit Compass write phase are complete.
