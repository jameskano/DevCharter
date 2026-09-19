# v0 migration map

## Purpose

This record classifies the complete pre-SPEC-0002A repository inventory. It proves that runtime
removal did not silently discard useful rules. Git history and the completed SPEC-0001 series retain
exact implementation detail; current files retain only implementation-independent product knowledge.

Classification precedence is exact path, then the narrowest listed glob. Generated ignored output
under a classified package inherits that package's disposition.

## Removed runtime and development paths

| Pre-transformation paths | Classification | Knowledge destination or rationale |
|---|---|---|
| `packages/core/package.json`, `packages/core/tsconfig*.json`, `packages/core/src/index.ts`, `packages/core/src/model.ts`, `packages/core/src/results.ts`, `packages/core/src/serialization.ts`, and their tests | Remove | TypeScript schemas, exports, result envelopes, and serialization were runtime shapes. Stable vocabulary and lifecycle rules remain in `AGENTS.md`, `MANIFEST.md`, and SPEC-0002. |
| `packages/core/src/repository.ts`, `safe-git.ts`, `safe-yaml.ts`, `legacy.ts`, `read-only.ts`, plus their tests | Migrate knowledge, then remove | Containment, provenance, conservative parsing, no-write inspection, and uncertainty rules are in `knowledge/shared-foundation.md` and `AGENTS.md`; detailed discovery belongs to SPEC-0002B. |
| `packages/core/src/project-architect.ts`, `packages/core/src/project-architect/**`, and `project-architect.test.ts` | Migrate knowledge, then remove | Modes, scopes, evidence separation, authority, preservation, minimum sufficiency, questions, and proposal decisions are in the Project Architect skill, shared foundation, parent SPEC-0002, and ready SPEC-0002B. Runtime heuristics and fingerprints are intentionally not transplanted. |
| `packages/core/src/project-architect/runtime-ai.ts` and its test | Migrate knowledge, then remove | The distinction between developer AI, product AI, dependency evidence, and future ideas is retained in `docs/product/purpose-and-scope.md`; detailed criteria belong to SPEC-0002B. |
| `packages/core/src/rendering.ts`, `application.ts`, `writer.ts`, `retry-state.ts`, and their tests | Migrate safety rules, then remove | Proposal/specification approval separation, path containment, preservation, accurate partial results, and sensitive-action confirmation are retained in `AGENTS.md`, `knowledge/shared-foundation.md`, and SPEC-0002. Deterministic rendering, receipts, hashes, retries, and managed writes are obsolete. |
| `packages/core/src/config.ts`, `config.test.ts`, and `import-boundary.test.ts` | Remove | `.devcharter.yaml`, runtime import boundaries, and configured JSON-era command transport have no current consumer. Repository-native verification authority remains a shared principle. |
| `packages/core/src/specification-architect-skill.test.ts` and `testing.ts` | Adapt/remove | Skill metadata validation moves to `scripts/validate-assets.mjs`; reusable specification guidance remains in the skill and `templates/specifications/implementation-spec.md`. Runtime test helpers are obsolete. |
| `packages/adapter-codex/**` | Migrate knowledge, then remove | The project-authored skills remain at `.agents/skills/`. Package asset copying, adapter APIs, deterministic rendering, and JSONC mutation are obsolete. Native Codex integration is deliberately deferred to SPEC-0002C. |
| `packages/cli/**` | Remove | Argument parsing, JSON input, envelopes, executable wiring, command presentation, and CLI test helpers implement a prohibited product surface. No user-facing command remains. |
| `packages/**/dist/**`, `packages/**/.typecheck/**`, `*.tsbuildinfo`, and package-local installed dependencies | Generated removal | Build output and caches contain no independent authority; source history preserves them if needed. |
| `tests/release/e2e.test.ts`, `fixtures.ts`, `fixtures.test.ts`, and `release-process.test.mjs` | Adapt/remove | Runtime/package journeys are obsolete. Location isolation and no-target-install behavior are adapted into `tests/fixtures/separate-locations.json` and `tests/scenarios/separate-locations.md`; full companion journeys belong to SPEC-0002D. |
| `scripts/build-production.mjs`, `qualify-packages.mjs`, and `release-process.mjs` | Remove | Production compilation, tarball qualification, installed CLI execution, and fixed release-command helpers existed only for removed packages. |
| `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`, `tsconfig.build.json`, `tsconfig.json`, `vitest.workspace.ts`, `eslint.config.js`, `prettier.config.js`, `.prettierignore` | Remove | Workspace, compiler, test, lint, formatting, and dependency state existed for the TypeScript runtime. The dependency-free static validator replaces only currently justified checks. |
| `prompts/codex/01-audit-and-plan.md`, `02-implement-active-spec.md`, and `03-review-completion.md` | Migrate knowledge, then remove | The prompts were SPEC-0001E-era operational wrappers. Their durable inspect/plan/verify/completion rules already live in `AGENTS.md`, the two shared skills, and current engineering documentation. Provider-native prompting belongs to SPEC-0002C. |

## Retained or updated paths

| Paths | Classification | Current role |
|---|---|---|
| `AGENTS.md`, `README.md`, `MANIFEST.md` | Update | Current repository authority and universal human/AI entrypoint. |
| `.agents/skills/project-architect/SKILL.md` | Update and retain | Shared conversational routing; runtime/API references removed. Detailed methodology remains SPEC-0002B work. |
| `.agents/skills/specification-architect/SKILL.md` | Update and retain | Shared SDD procedure with an optional template reference. |
| `docs/product/purpose-and-scope.md`, `docs/architecture/system-overview.md`, `docs/user-guide.md`, `CHANGELOG.md` | Update | Current static architecture, usage, and breaking-transition record. |
| `docs/engineering/quality-and-decision-model.md`, `docs/engineering/spec-driven-workflow.md` | Retain | Already implementation-independent current guidance; reviewed without substantive change. |
| `docs/release/v0-qualification.md`, `docs/release/habit-compass-pilot.md` | Retain as historical evidence | Historical banners prevent these records from being read as current instructions. |
| `specs/approved/SPEC-0001-devcharter-v0.md`, `specs/done/SPEC-0001A` through `SPEC-0001E` | Retain as historical evidence | Exact prior contracts and completion evidence. They do not govern current behavior. |
| `specs/approved/SPEC-0002-companion-driven-devcharter.md`, `specs/done/SPEC-0002A*`, `specs/ready/SPEC-0002B*` through `SPEC-0002D*`, status README files | Retain/update routing | Current product authority and ordered implementation work. |
| `references/official-codex-capabilities.md` | Retain | Dated capability evidence consumed by later native-integration work; it is not product authority. |
| `.github/workflows/ci.yml`, `.gitattributes`, `.gitignore`, `package.json` | Simplify and retain | Cross-platform contributor-only static verification and repository hygiene. There are no dependencies, package exports, or product binaries. |

## Added current destinations

- `companions/*/README.md` provides honest interim routing without claiming completed native
  integrations.
- `knowledge/shared-foundation.md` holds implementation-independent rules extracted from runtime
  behavior.
- `templates/specifications/implementation-spec.md` is optional guidance consumed by the
  Specification Architect.
- `tests/fixtures/separate-locations.json` and `tests/scenarios/separate-locations.md` adapt the one
  SPEC-0002A journey that can be proven before later methodology and integration work.
- `scripts/validate-assets.mjs` verifies only DevCharter-owned static assets.

## Review conclusion

Every tracked pre-transformation path and ignored build-output category matches a row above. Exact
runtime mechanics remain recoverable from Git and historical specifications; no TypeScript schema
was copied into Markdown merely to preserve its shape. Later-spec work is named but not implemented.
