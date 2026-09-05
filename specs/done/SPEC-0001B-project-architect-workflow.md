# SPEC-0001B — Project Architect Workflow

## Metadata

| Field | Value |
|---|---|
| ID | SPEC-0001B |
| Parent | SPEC-0001 |
| Status | done |
| Reason | Implementation, acceptance evidence, and required author verification are complete; the user explicitly approved the completion transition |

## Purpose

Implement the main DevCharter workflow for creating, improving, or auditing a repository's AI-assisted development ecosystem.

## Public commands

```bash
devcharter new [--scope full|governance|engineering|ai] [--format human|json]
devcharter retrofit [--scope full|governance|engineering|ai] [--format human|json]
devcharter audit [--scope full|governance|engineering|ai] [--format human|json]
```

All modes default to `full`. There is no `check` command.

## New

Use for an empty or lightly initialized repository.

New must:

1. inspect the directory before asking questions;
2. detect meaningful implementation or governance already present;
3. recommend retrofit when the repository is materially established;
4. infer constraints and risks from material evidence, ask only when they remain unresolved and
   consequential, and otherwise record an explicit empty assumption;
5. produce the smallest useful proposal;
6. wait for explicit approval;
7. delegate approved application to 0001D;
8. validate and report.

## Retrofit

Use for an existing repository.

Retrofit must preserve useful conventions and user-owned content while finding gaps, broken references, conflicting or superseded sources, redundant AI material, missing verification, unsafe generation history, and unjustified complexity.

It proposes targeted changes and may recommend removing or consolidating material, but it never deletes or replaces it without approval.

## Audit

Audit is read-only at the filesystem boundary.

It reports:

- findings and evidence;
- confidence and uncertainty;
- missing, conflicting, obsolete, or overlapping elements;
- broken paths, commands, or instruction routing;
- source-of-truth and spec-precedence problems;
- unnecessary components;
- verification and journey gaps;
- recommended follow-up.

Audit never creates configuration, receipts, sessions, caches inside the repository, or modified timestamps attributable to DevCharter.

## Scopes

### Full

Union of governance, engineering, and AI.

### Governance

Project truth, architecture/feature documentation, specs, decisions, assumptions, status/precedence, and documentation synchronization.

### Engineering

Repository layout, runtime, package manager, commands, formatting, linting, typing, tests, CI, security checks, environment conventions, and relevant operations.

### AI

Root and nested instructions, skills, tool-specific configuration, prompts or agents already present, hooks, MCP integrations, permissions, and evaluations—without assuming that any of them are required.

Cross-cutting qualities are considerations within the selected scope, not more scopes.

## Discovery pipeline

### 1. Inventory

Recursively enumerate repository paths while applying explicit safe ignores for conventional
dependency directories (`node_modules`, `.pnpm`, `.yarn`, `vendor`, `bower_components`, `Pods`,
`.venv`, and `venv`), caches, build output, binary assets, and generated/vendor content. An
ambiguous project source directory named `vendor` is not excluded without a conventional
repository position or stronger provenance.

Do not claim to have semantically reviewed every source file merely because every path was enumerated.

### 2. Classify

Classify relevant artifacts by kind, origin, ownership, native tool target, and likely authority
before semantic inspection or fingerprinting.

Distinguish project-authored skills from installed third-party skill packages and preserve available
lock/provenance information. A project-local skill is project-authored unless explicit provenance
identifies it as third-party. Explicitly third-party skills remain inventoried but cannot influence
project facts, findings, references, recommendations, or fingerprints.

### 3. Inspect relevant sources

Inspect, as applicable:

- manifests, workspace files, runtime/tool versions, and scripts;
- repository structure and representative implementation;
- docs, specs, decisions, and indexes;
- tests, test helpers, E2E flows, and CI;
- root/nested AI instructions, skills, prompts, agents, hooks, MCP/configuration;
- existing generated-file metadata;
- Git status and relevant current changes.

### 4. Build evidence-backed facts

Each material inferred fact identifies its evidence and confidence. Shallow heuristics such as “no conventional test directory means no tests” are insufficient.

### 5. Map authority and references

Identify:

- source of truth per concern;
- duplicate or conflicting instructions;
- superseded specifications;
- referenced files, commands, and paths that do not exist;
- documented commands that disagree with package scripts or CI;
- AI mechanisms that are not native to the selected tool and lack explicit routing.

Command validation is intentionally bounded: npm, pnpm, yarn, and bun scripts resolve against the
applicable `package.json`; static Python script and common verification-tool declarations resolve
against `pyproject.toml`; and standard Cargo, Go, and Maven verification commands resolve against
their native manifests. Unfamiliar or dynamically composed commands produce uncertainty. No general
shell parser is implied.

Codex instructions use native directory precedence. `AGENTS.override.md` replaces `AGENTS.md` in
the same directory without creating a conflict, while root and nested instructions remain layered.
Only actual ambiguity or duplicated instruction content is reported.

### 6. Identify journeys

Derive developer workflows from authoritative verification scripts and CI. Derive user journeys
only from explicit current documentation, specifications, or E2E test titles; filenames and source
text alone are insufficient. Report a missing-journey gap for established repositories when
applicable, while genuinely new repositories may return an explicit empty journey list.

### 7. Ask only unresolved questions

Questions must materially affect desired behavior, architecture, risk, or output. Include the detected context and a recommended default when appropriate.

## AI classification

Do not conflate:

- developer-AI configuration;
- runtime/product AI implementation;
- unused AI dependencies;
- future AI scope mentioned in docs/specs;
- generic uses of words such as “prompt.”

## Proposal contract

Every proposal includes:

- proposal revision and repository fingerprint;
- mode and scope;
- detected facts with evidence and confidence;
- intended target state;
- findings, assumptions, open questions, and conflicts;
- critical journeys;
- components materially considered and, when applicable, included, rejected, or deferred;
- planned files classified as create/update/skip/conflict;
- files explicitly preserved;
- ownership/provenance implications;
- dependencies and maintenance cost;
- risk and validation plan;
- deferred work.

Every proposed artifact explains why it exists. “Best practice” alone is not sufficient.

`consideredComponents` may be empty when repository evidence and accepted decisions do not justify
considering an optional component. Empty does not mean the field is absent; human and JSON output
still expose the explicit empty section.

Conflict dominates every other action. A finding against an existing path produces `update` unless
it is a conflict. `skip` requires existing relevant, non-placeholder content: manifests must supply
the needed verification authority and AI instructions must be meaningful and free of routing or
reference conflicts. Inadequate existing targets produce `update`, never `skip`.

`PlannedFileChange` is the single staged change contract. In this specification it contains the
target path, create/update/skip/conflict action, purpose, repository-specific reason, origin,
ownership, dependencies, maintenance implication, and validation expectations. Proposed content,
diff, and adapter remain optional because rendering belongs to SPEC-0001D. New and retrofit put
their real abstract decisions in `EcosystemProposal.plannedChanges`; they do not create a parallel
artifact-decision representation.

SPEC-0001D must narrow this contract before application: create/update changes require rendered
content or a reviewable diff and the selected adapter where applicable. Rendering changes proposal
identity and therefore requires a refreshed proposal fingerprint and explicit write approval.

Every proposal also carries a deterministic `proposalFingerprint` over all approval-relevant
canonical content: mode, scope, desired outcome, facts, findings, conflicts, assumptions, accepted decisions,
questions, critical journeys, considered components, planned changes, preserved paths, risks,
validation, and deferred work. Approval binds explicit confirmation to the proposal fingerprint,
proposal revision, and scoped repository fingerprint. Derived approval state, the fingerprints
themselves, revision, timestamps, diagnostics, and presentation-only summaries are excluded from
proposal identity.

## Approval

New and retrofit cannot write without explicit approval of the current proposal revision.

If relevant repository state changes materially after approval, invalidate or refresh only the affected proposal portions and request approval again.

Audit requires no write approval because it cannot write.
An audit-mode value is not a valid proposal mode and is rejected defensively by the approval API.

SPEC-0001B exposes approval only as a pure in-memory core API. The `new` and `retrofit` CLI commands
always return unapproved proposals. No proposal, answer, approval, conversation, or session is
persisted, and no file application is possible in this specification.

Approval is rejected for a mismatched revision, proposal fingerprint, repository fingerprint,
cross-proposal replay, unresolved required questions, or any material proposal-content change.

## Scoped repository fingerprint

Machine-readable results expose the exact included paths, exclusions, and safe Git facts used by
the scoped repository fingerprint. There are no hidden inputs. Governance, engineering, and AI
select only relevant safe project-authored text; full is their de-duplicated union. Paths used for
mode classification or reference validation are identified explicitly.

Dependencies, caches, generated/vendor output, `.git` contents, binaries, likely secrets,
oversized files, unsupported types, and external symlink targets are never content-hashed merely
for fingerprinting. Semantic inspection is limited to safe UTF-8 text no larger than 1 MiB;
fingerprint hashing is limited to safe non-secret text no larger than 4 MiB. Exclusions and material
uncertainty are reported. Algorithm version 2 hashes a canonical manifest of approval-relevant
oversized, unsafe, unsupported, and external-symlink exclusion metadata, but never their contents.
For AI scope, mode-classification-only source digests additionally bind the canonical set of imports
that match declared supported AI dependencies. This changes approval identity when runtime-AI
evidence changes without making unrelated source bodies complete AI-scope content dependencies.

Git inspection is optional and read-only. It uses a fixed non-mutating command allowlist through
`execFile` without a shell, disables optional locks, index refresh helpers, prompts, fsmonitor, and
the untracked cache, and avoids submodule traversal. Unsafe worktree pointers, unsupported Git
behavior, timeouts, and failures produce unavailable or uncertain facts instead of broader commands.

## New versus retrofit recommendation

The recommendation uses explicit evidence rules rather than a file-count threshold. Material source
code, deployment configuration, or substantial current documentation may independently justify
retrofit. Application structure with operational support may also justify retrofit. Git history,
non-trivial scripts, tests, CI, workspaces, and governance only support or corroborate stronger
current evidence. Historical specifications, prompts, references, generated configuration code,
README-only repositories, minimal manifests, empty scaffolds, and placeholders do not independently
establish a current implementation. Results expose supporting and contrary evidence, confidence,
and uncertainty.

## Output

Human and JSON outputs include mode, scope, summary, facts, findings, assumptions, questions,
critical journeys, considered/rejected components, planned changes, preserved paths, conflicts,
risks, validation, deferred work, and applied changes. Empty sections are explicit. Audit returns
meaningful analysis fields with no proposal and an empty planned-change list.

Human facts expose state, confidence, and evidence. Human findings expose impact, confidence,
evidence, uncertainty when present, and the recommended action. The JSON schema and public result
types remain unchanged. Human output previews at most 20 preserved paths and reports the omitted
count; JSON retains the complete array.

## Idempotency expectations

- Retrofit does not duplicate files or content.
- New does not initialize twice.
- Audit does not change state.
- Reapplying an unchanged approved proposal is a verified no-op or fails safely as stale.

## Non-goals

- Persisted sessions.
- General task tracking.
- Specification content owned by 0001C.
- File rendering and application owned by 0001D.
- Release qualification owned by 0001E.
- Automatic full-repository semantic rescanning on every small task.

## Acceptance criteria

1. New, retrofit, and audit exist with exactly four scopes.
2. Audit is proven read-only and creates no repository state.
3. Discovery enumerates deeply while distinguishing enumeration from semantic inspection.
4. Generated/vendor/cache and third-party material are classified rather than treated as project truth.
5. Important facts include evidence and confidence.
6. Source-of-truth, spec precedence, broken references, and command/CI inconsistencies are detected.
7. Developer-AI and runtime/product AI are distinguished.
8. Installed and project-authored skills can be distinguished when evidence exists.
9. Questions are minimal, material, and context-aware.
10. Proposals contain create/update/skip/conflict decisions and report evidence-driven included,
    rejected, or deferred components when applicable.
11. Every proposed artifact has a repository-specific reason and maintenance implication.
12. New and retrofit require approval of the current proposal revision.
13. Material repository changes invalidate affected approval.
14. Existing content is preserved by default.
15. Results support stable human and JSON formats.
16. Tests cover modes, scopes, discovery classification, approvals, audit, stale proposals, and idempotency.

## Implementation evidence

Status: complete. The implementation, acceptance evidence, 313-test suite, standalone
12-combination CLI matrix, validation, and full-repository read-only audit passed. The user
explicitly approved the completion transition after reviewing the final bounded correction.

### Implemented behavior

- Added the offline `@devcharter/core/project-architect` API with scoped discovery, explicit
  fingerprint inputs, evidence-weighted mode recommendations, evidence/confidence facts,
  deterministic specification/command/instruction authority maps, bounded reference/command
  analysis, staged proposals, deterministic proposal identity, and pure approval with
  current-repository revalidation.
- Added conventional dependency/cache boundary classification, scope-isolated facts and findings,
  workspace-aware command resolution, ambiguity conflicts, missing-verification analysis,
  duplicate-AI detection by content hash, instruction-routing conflicts, and unknown generated
  ownership findings.
- Classifies root and manifest-backed `vendor` directories as dependencies while preserving,
  inspecting, and fingerprinting unproven nested `vendor` content as project-owned material.
- Validates path-only Markdown code spans outside fenced examples, fingerprints existing referenced
  content, and limits missing-inline-path findings to explicit reference-intent prose.
- Uses bounded dependency declarations plus explicit imports to distinguish runtime AI from
  dependency-only evidence across npm, Python, Cargo, Go, Maven/Java, and Maven/Kotlin repositories.
- Resolves skill provenance before semantic analysis and fingerprinting, conservatively keeps local
  skills project-authored absent explicit third-party provenance, classifies Python/Rust/Go/Java/
  Kotlin source and tests, and keeps known JavaScript and Gradle tool configuration out of material
  source evidence.
- Uses bounded command authorities for npm, pnpm, yarn, bun, Python, Cargo, Go, and Maven; reports
  unsupported or dynamic commands as uncertainty; and applies Codex `AGENTS.override.md` precedence
  without creating a false same-directory conflict.
- Uses explicit establishment evidence with Git history only corroborating current material, derives
  developer and user journeys only from authoritative repository evidence, and reports missing
  journey evidence only for established applicable scopes.
- Added validated accepted-decision contracts, evidence inference, material scope-specific
  questions, actionable per-target proposals with stable conflict precedence, explicit conflict
  subsets, and preservation of all project-origin paths.
- Makes proposal actions content-aware: findings update their existing targets, conflict dominates,
  and skip requires a meaningful README/instruction file or a valid manifest with verification
  authority.
- Added `new`, `retrofit`, and `audit` to the current-directory CLI with all four scopes and stable
  complete human/JSON result sections. New and retrofit always return unapproved proposals; audit
  returns analysis with no proposal, approval state, or planned changes. Human facts and findings
  now include their complete evidence, confidence, impact, uncertainty, and recommended action.
- Restricted proposals to `new | retrofit`, rejects audit proposals defensively, and binds conflicts
  plus every other material proposal-content family into proposal identity.
- Preserved `inspect`, `validate`, configuration/YAML safety, stable serialization, repository
  containment, the separately exported atomic writer, offline behavior, and every SPEC-0001A test.
- Added fixed read-only Git invocation with optional locks, prompts, fsmonitor, untracked cache, and
  submodule traversal disabled. Unsafe or unavailable Git state becomes uncertainty.
- Corrected fingerprint freshness with algorithm version 2: canonical approval-relevant exclusion
  metadata participates in identity, while secret, binary, dependency, generated, cache, and
  external-symlink contents remain unhashed and irrelevant scoped churn stays isolated.
- Separated loaded/fingerprinted text from analyzer-confirmed semantic inspection, added bounded
  version-1 `skills-lock.json` provenance, inferred only substantive current outcomes, replaced
  routine constraint/risk questions with evidence-backed empty defaults, and made considered
  components evidence-driven.
- Prefer root aggregate, CI, or root verification journeys over redundant package builds; human
  output bounds preserved-path previews at 20 while JSON remains complete.
- Extracted fingerprint canonicalization and skill provenance into small internal modules while
  preserving `@devcharter/core/project-architect` as the public import.
- Extracted bounded runtime-AI evidence into an internal canonical module shared by fact generation
  and AI-scoped fingerprinting. Matching import changes now stale approval, while unrelated
  source-body edits with unchanged import evidence remain stable.
- Made runtime-AI dependency authority package-local and ecosystem-specific. Every declaration now
  retains its normalized manifest path, manifest directory, ecosystem, and dependency identifier;
  each source is matched only against the nearest ancestor manifest for its own ecosystem, including
  nearer manifests with no matching dependency.
- Added bounded JavaScript/TypeScript lexical masking for line and block comments, quoted string
  examples, and template raw text while retaining executable template interpolations and the
  supported static, side-effect, `require`, and dynamic import forms. Facts, proposals, scoped
  fingerprints, and approval validation continue to consume the same canonical evidence result.
- Extended inactive-region masking to Python, Rust, Go, Java, and Kotlin while preserving their
  bounded supported active import declarations. Rust nested block comments and raw strings, Go raw
  strings and declaration-only import extraction, Python triple-quoted examples, and Kotlin
  triple-quoted examples are covered explicitly.
- Restricted Python dependency discovery to `[project].dependencies`, keys under
  `[project.optional-dependencies]`, and `[tool.poetry.dependencies]`; unrelated arrays, comments,
  and malformed relevant input remain unconfirmed.
- Made production eligibility consume the existing artifact classifier: only normalized paths
  classified as project `source` can confirm runtime implementation. Classifier-provided test paths
  are tracked separately as test-only matches and cannot contribute facts or matching-import
  fingerprints.
- Replaced provider-word equivalence with a small ecosystem-specific registry of exact dependency
  identities and deliberately supported import identifiers/prefixes. Lookalike declarations remain
  unconfirmed and cannot authorize provider imports or alter canonical matching evidence.
- Replaced unrestricted Maven dependency matching with a deterministic tag-context scanner. Maven
  runtime-AI authority is limited to a direct `dependency` child of the root project's direct
  `dependencies` element. XML comments, CDATA, dependency management, build/reporting plugins,
  profiles, arbitrary nesting, and `test` or `import` scopes are ignored; malformed or ambiguous XML
  yields no Maven dependency evidence. The result continues through the single canonical fact,
  fingerprint, proposal-identity, and approval-freshness path.
- Replaced vocabulary-only constraint/risk detection with contextual section and sentence evidence,
  preventing product-domain words from creating blocking questions while retaining explicit
  restrictions, compatibility decisions, and concrete risks.
- Synchronized the normative proposal contract and AC10 with evidence-driven, explicitly empty
  `consideredComponents` behavior.
- Kept rendering, adapters, receipts, writes, and application deferred to SPEC-0001D.

### Verification results

| Command or journey | Actual result |
|---|---|
| `pnpm install --offline --frozen-lockfile` | Passed; the lockfile was current and packages were already installed. |
| `pnpm format:check` | Passed. |
| `pnpm lint` | Passed. |
| `pnpm typecheck` | Passed. |
| `pnpm test` | Passed: 9 test files and 313 tests. |
| `pnpm build` | Passed. |
| `pnpm devcharter validate` | Passed in the approved external execution context; the restricted sandbox launcher still returns `EPERM` while resolving the workspace parent. |
| Targeted runtime-AI correction tests | Passed: 2 test files and 249 tests, including 92 direct canonical-module cases and 157 public Project Architect tests; the Maven additions cover direct dependency authority, ignored contexts, production/test evidence, deterministic ordering, fingerprints, and approval freshness. |
| Targeted contextual-question tests | Passed: 9 tests covering negative and positive fixtures, blocking, and accepted decisions. |
| CLI mode/scope matrix | Passed all 12 combinations through the built CLI; every result used the requested scope and reported zero applied changes. |
| Audit repository/Git snapshots | Passed: the six-line pre-audit Git status was byte-for-byte unchanged; `.git/index` SHA-256 remained `B9624911DB93F9A53E959E510F3FB5677761059CBD1788012BE7A760F077B2C4` and its UTC modification time remained `2026-09-04T17:34:18.5976369Z`; the independently built audit reported no proposal, zero planned changes, and zero applied changes. |
| Built full-scope audit | Passed in the approved external execution context with zero findings, no proposal, no planned changes, and zero applied changes. |
| Project Architect import audit | Passed across the orchestrator and all three internal modules; no writer, adapter, generator, application, network, or telemetry import is reachable. |
| `git diff --check` | Passed; Git reported only working-tree line-ending notices. |

### Acceptance evidence

| Criterion | Evidence |
|---|---|
| 1 | CLI parsing and matrix tests cover three modes, four scopes, default full, invalid scopes, and obsolete/deferred command rejection. |
| 2 | CLI/core snapshot tests cover successful/failing audit behavior, worktree files, and contained Git metadata; import audits prove no writer path. |
| 3 | Inventory/fingerprint tests distinguish enumeration, loaded/hash-only inputs, reference dependencies, and analyzer-confirmed semantic-inspection paths. |
| 4 | Boundary tests keep root and manifest-backed `vendor` directories third-party while unproven nested `app`, `src`, `lib`, and package-subtree variants remain inspected project material; cache/dependency and skill-provenance coverage remains intact. |
| 5 | Canonical schema, recommendation, human-output, and journey tests require evidence and confidence for inferred facts and mode signals; Maven runtime-AI facts require a structurally authoritative direct dependency plus matching active production import. |
| 6 | Fixtures cover duplicate specification authority, native instruction precedence, command authority, status/precedence conflicts, links and path-only inline references, reference fingerprints, fenced-example exclusions, and documentation/CI drift. |
| 7 | Table-driven polyglot and package-authority fixtures distinguish declared-and-production-imported runtime AI from dependency/test-only evidence, prevent sibling and cross-ecosystem authorization, enforce the nearest applicable manifest, mask inactive examples in every supported language, restrict Python manifest authority, reject lookalike dependency mappings, and prove that only direct root-project Maven dependencies outside comments, CDATA, management, plugins, profiles, arbitrary nesting, and test/import scopes can confirm JVM runtime AI. |
| 8 | Skill fixtures distinguish repository-authored, explicitly marked third-party, unambiguously locked third-party, and invalid/ambiguous provenance without trusting installed instructions. |
| 9 | Question tests cover documented outcome inference, placeholder rejection, domain-word false positives, contextual restrictions and risks, accepted decisions, blocking behavior, and non-blocking evidence-backed empty defaults. |
| 10 | Staged proposal tests exercise content-aware create, update, skip, and conflict decisions; considered components are empty unless evidence or a proposal decision makes an optional component relevant. |
| 11 | Schema and proposal tests require repository-specific reason, dependencies, maintenance implication, and validation expectations without rendering fields. |
| 12 | Approval tests bind explicit confirmation to revision plus independently recomputed proposal and repository fingerprints, block unresolved questions and empty actions, and reject audit proposals defensively. |
| 13 | Tests reject cross-proposal replay, proposal mutations, relevant uncertain-exclusion and valid authoritative production runtime-AI evidence changes, inline-reference changes, and project-content changes. Maven tests prove direct dependency/import changes stale approval while comment, CDATA, dependency-management, plugin, profile, and test-scope-only changes leave AI approval current. |
| 14 | Proposals enumerate preserved project-origin paths including unproven nested `vendor` files; target aggregation prevents replacement duplication; repository and Git snapshots prove no deletion, rendering, or write. |
| 15 | Canonical hashing, repeated-result equality, bounded human-output fixtures, complete JSON arrays, and all-mode contract tests cover every required section and audit's lack of a proposal. |
| 16 | All 313 unit/integration tests plus the 12-case standalone built-CLI matrix and built full audit cover discovery/classification, package/ecosystem authority, bounded Maven structure, polyglot lexical masking, Python section authority, production/test eligibility, exact dependency mapping, provenance, semantic accounting, decisions, proposals, approval, deterministic repetition, negative behavior, stale state, Git failure, and no-write guarantees. |

### Documentation review and limitations

Updated by the current correction: the system overview now states the direct-Maven-dependency
authority boundary, and this completed specification records its implementation and evidence. Earlier
SPEC-0001B passes also updated README, manifest routing, the audit/plan prompt, the staged SPEC-0001A
contract description, and the narrow SPEC-0001D rendered-change boundary.

Reviewed unchanged for the current correction: AGENTS.md, MANIFEST.md, README, purpose and scope,
quality and decision model, spec-driven workflow, official Codex capability reference, specs index,
SPEC-0001A, SPEC-0001C, SPEC-0001D, SPEC-0001E, and implementation/review prompts. Their
responsibilities, public contracts, and later-spec boundaries remain accurate; only the system
overview required clarification of the runtime-AI discovery model.

Limitations and deferred work:

- Git facts are intentionally unavailable for external worktree pointers or unsafe/unsupported Git
  behavior.
- Semantic inspection and hashing honor explicit size, secret, binary, generated, and dependency
  exclusions; approval-relevant uncertain exclusion metadata, but never its content, participates in
  fingerprint algorithm version 2.
- Lock-based skill provenance intentionally supports only version `1` with a `skills` object whose
  key matches the final segment of an explicit `.agents/skills/<name>` path and whose entry includes
  non-empty `path` and `source` strings. Other shapes remain conservative and report uncertainty.
- A root or applicable-manifest-backed `vendor` directory is a dependency boundary; other nested
  `vendor` directories remain project material unless stronger provenance is available.
- Runtime-AI recognition is intentionally limited to a small exact identifier registry, bounded
  authoritative manifest sections, nearest-ancestor package authority within the supported
  JavaScript, Python, Rust, Go, and JVM ecosystems, and active imports from classifier-designated
  production sources. It does not implement package-manager module resolution or claim semantic use
  from prose, tests, inactive examples, or network package metadata. The bounded language scanners
  are not general-purpose parsers. AI-scope source fingerprints bind only matching canonical
  authoritative production-import evidence unless the path is otherwise selected for complete
  content hashing. Maven inspection is a bounded tag-context scan, not effective-model resolution:
  it does not resolve parents, BOMs, profiles, properties, plugins, the local Maven cache, XML
  entities, or network metadata, and it returns no dependency evidence for malformed or
  structurally ambiguous XML.
- Command interpretation is intentionally limited to statically recognizable package-manager,
  Python, Cargo, Go, and Maven forms. Shell composition, plugins, aliases, and dynamically selected
  commands are reported as uncertainty rather than interpreted.
- Analysis is deterministic and evidence-based but does not claim full semantic understanding of
  every enumerated source file.
- Specification authoring remains in SPEC-0001C; rendering, refreshed write approval, and
  application remain in SPEC-0001D; release qualification remains in SPEC-0001E.

### Completion review history and final approval

The paragraphs below preserve the sequence of earlier review findings and corrections. Statements
that a fresh review was pending describe those checkpoints and are superseded by the final
completion approval recorded at the end of this section.

The initial read-only completion pass converted all 16 acceptance criteria into evidence checks,
reviewed the implementation and documentation diff, reran the built full audit, and found one
important bounded-parser issue: Markdown/spec fixture strings inside TypeScript and ordinary prose
containing “pnpm” could produce false findings. The implementation was corrected to restrict those
parsers to their authoritative file and command contexts, and a regression test was added.

The most recent independent read-only completion review returned `FAIL` and found the prior
PASS/done-eligibility claim premature. Its blocking and important findings covered conventional
vendor/dependency classification, incomplete authority/reference/command analysis, insufficient
accepted-decision and question handling, non-actionable or duplicate proposal decisions, missing
conflict/result fields, audit-proposal approval, scope leakage, incomplete output coverage, and
untrustworthy acceptance/verification evidence.

This correction pass addresses those findings in the deterministic core, public contracts, CLI
output, tests, and current documentation while keeping all Project Architect workflows read-only.
Author verification was recorded, but at that checkpoint it was not a substitute for the required
independent completion review, so SPEC-0001B remained `active` pending further review.

A second failed verification identified narrower semantic gaps after that broad correction:
third-party skill provenance was applied too late; source/test and command classification was too
JavaScript/pnpm-specific; mode recommendation over-weighted counts and history; native Codex
override precedence was treated as conflict; journeys were hard-coded; existing placeholder targets
could be skipped; and human findings omitted decision-critical evidence. The current correction
implemented those bounded fixes without adding a shell parser, public contract, persistence,
generation, application, or later-spec behavior. At that checkpoint, author verification still
required a fresh independent read-only review before a `done` transition.

The next independent review reproduced three remaining acceptance failures: unproven `app/vendor`
project content was excluded from preservation and approval identity, path-only Markdown references
were not validated, and runtime-AI inference was JavaScript-only. This correction implements the
approved bounded plan for evidence-based vendor boundaries, reference-intent-aware inline paths,
and polyglot declared-dependency/import evidence. Targeted and broad author verification now pass,
including the previously blocked standalone matrix and full-repository audit. The specification
remained `active` at that checkpoint pending a fresh independent read-only completion review.

The final independent review found a runtime-AI approval-freshness defect, vocabulary-only
constraint/risk questions, and a normative considered-component inconsistency. This correction
binds canonical runtime-AI evidence to AI-scoped fingerprints, requires contextual question
evidence, and synchronized the normative contract. Author verification passed, but the
specification remained active at that checkpoint pending a fresh completion review.

A subsequent implementation review found that runtime-AI dependency evidence could cross sibling
package or ecosystem boundaries and that JavaScript/TypeScript imports in comments and strings were
treated as executable. The current correction adds nearest applicable manifest authority and
bounded lexical masking in the single canonical runtime-AI evidence module, with direct and
Project Architect regressions for facts, scoped fingerprints, and approval freshness. Author
verification passed; no independent verification was claimed, and SPEC-0001B remained `active` at
that checkpoint.

A further implementation review found polyglot inactive-import false positives, over-broad Python
TOML arrays, test-only product evidence, and provider-word dependency equivalence. The current
correction adds bounded inactive-region filtering for every supported language, exact supported
Python dependency sections, classifier-supplied production/test eligibility, and an explicit
ecosystem-specific dependency/import registry in the shared canonical evidence path. Author
verification passed for facts, fingerprints, and approval freshness; no independent verification
was claimed, and SPEC-0001B remained `active` at that checkpoint.

The final bounded correction addresses Maven declarations that were syntactically present but not
authoritative application dependencies. A deterministic tag-context scanner now accepts only the
root `project` → direct `dependencies` → direct `dependency` structure and rejects ignored scopes,
inactive XML regions, unsupported ancestry, and malformed ambiguity. Direct and public regressions
cover facts, production/test evidence, AI-scoped fingerprints, stale/current approvals, and repeated
determinism. All author checks passed, but no independent verification was claimed at that
checkpoint.

### Final completion approval

On 2026-09-05, after the final bounded Maven correction and all recorded author checks passed, the
user explicitly directed that SPEC-0001B be marked completed. This approval closes the earlier
pending-review checkpoint and authorizes the `active` to `done` lifecycle transition. No claim is
made that the final Maven correction received a separate independent review in this turn.

### Post-completion Maven XML well-formedness correction

On 2026-09-06, before SPEC-0001C activation, the bounded Maven tag-context scanner was corrected to
return no dependency evidence for duplicate attributes, undeclared entities, unbound namespace
prefixes, or foreign non-Maven element namespaces. Namespace handling remains deliberately narrow:
ordinary unqualified POM fixtures, the Maven POM namespace, its conventional XML Schema Instance
metadata, predefined XML namespaces, and numeric or predefined entity syntax are recognized only
to establish well-formed bounded input. The scanner still does not resolve effective Maven models,
parents, BOMs, properties, profiles, plugins, local repositories, or network metadata.

Direct runtime-AI tests now cover valid Maven namespace forms plus duplicate raw and expanded
attributes, undeclared entities, unbound prefixes, and foreign namespaces. Public Project Architect
regressions prove the absence of runtime and unused-dependency facts, stable AI-scope fingerprints
and current approvals across invalid-only changes, and stale approval when invalid XML becomes a
valid direct supported dependency. Targeted verification passed 262 tests across the 98-test direct
runtime-AI suite and 164-test Project Architect suite. The complete repository suite passed 10 files
and 332 tests. SPEC-0001B remains `done`; this correction narrows malformed input accepted by its
existing contract and adds no feature, public API, status, command, or general Maven resolver.
