# Ecosystem component selection

Use this reference to decide whether a component earns a place in a proposal. It is a decision aid,
not a generation catalog. Repository evidence and accepted user decisions remain authoritative.

## Decision record

For each relevant component, record its evidence, value, risks, owner, maintenance path, and one
decision: `create`, `update`, `preserve`, `skip`, `replace`, `reject`, or `conflict`. `Replace`
requires evidence that the existing component cannot be repaired economically. `Conflict` remains
unresolved until authority or ownership is established. A missing component is not automatically a
gap.

| Component | Evidence that may justify it | Value and maintenance | Reasons to preserve, skip, or reject |
|---|---|---|---|
| Current docs/source-of-truth map | Important facts are absent, stale, duplicated, or hard to locate | Gives people and companions one maintained authority per concern | Preserve adequate current docs; reject duplicate handbooks and speculative sections |
| Specifications/decision records | Non-trivial behavior, public contracts, migrations, sensitive choices, or architectural decisions need durable authority | Makes scope, approval, and verification reviewable | Skip for routine maintenance; do not create multiple planning artifacts when one spec is clear |
| Root instructions | Stable repository-wide commands and constraints are not discoverable through native conventions | Routes every companion to concise shared truth | Preserve one adequate root file; reject copied project documentation |
| Path-specific instructions | A subtree genuinely needs different commands, ownership, or safety rules | Narrows local behavior without bloating root instructions | Skip when rules merely repeat the root |
| Skills | A stable, repeatable, multi-step procedure benefits from on-demand guidance | Encapsulates a maintained procedure with an identifiable owner | Reject ordinary documentation, one-off tasks, and a skill per technology |
| Prompts/agents | A supported companion has a durable native use case that shared instructions cannot express | May improve a specific repeated interaction | Reject role fleets, aliases without maintained value, and provider duplication |
| Hooks | A deterministic local event must enforce a confirmed invariant | Can prevent a known failure automatically | Reject hidden side effects, untrusted scripts, slow checks, or safeguards users cannot bypass safely |
| Plugins/MCP | An approved workflow needs an external capability unavailable through existing tools | Connects a defined service or data source | Reject speculative integrations, broad permissions, secret persistence, and unjustified network access |
| Manifest/dependency management | The selected stack requires it or existing authority is broken | Establishes reproducible dependency and command ownership | Preserve native files; do not add DevCharter or rewrite versions from memory |
| Formatter/linter/type checker | Relevant source lacks an adequate equivalent and inconsistency materially harms reliable work | Provides repeatable local feedback; requires config and an owner | In retrofit, skip preference-only replacements and overlapping tools |
| Unit/integration/E2E tests | A critical behavior or boundary lacks practical evidence | Protects behavior at the cheapest effective level | Reject redundant layers and tests that only prove mocks |
| Build/run/debug harness | Contributors cannot reliably establish or observe a working state | Makes setup and diagnosis repeatable | Skip invented commands; preserve authoritative native workflows |
| Browser/accessibility harness | A material user journey or accessibility requirement needs rendered evidence | Verifies behavior isolated checks miss | Skip for non-UI work or when an honest documented manual check is sufficient |
| Data/migration harness | Approved schema or data changes need safe setup, fixtures, rollback/recovery evidence | Reduces destructive uncertainty | Reject production data copies, secrets, and unapproved migrations |
| CI | Required checks need shared remote enforcement or the user requests it | Repeats authoritative local checks in a maintained environment | Skip when no remote model is accepted or local verification is sufficient |
| Release/operations harness | Shipping or operating the project has a defined critical journey | Makes release, health, and recovery observable | Reject speculative platform configuration and credentials in the repository |
| Quality-specific checks | Security, privacy, reliability, accessibility, performance, or cost is materially important | Adds focused evidence for a named risk | Reject generic scorecards and tools without a decision consequence |

Generated framework structure may be large and still minimum-sufficient. Conversely, a tiny AI
configuration file is unjustified when no supported consumer or maintenance purpose exists.

## Ownership and provenance

Classify content as project-authored, DevCharter-generated, third-party, generated/vendor, or
unknown. Applied starter documentation becomes project-owned unless explicitly declared managed.
Record third-party initializer, package, skill, and plugin provenance. Do not silently overwrite
project-owned content or treat a local third-party file as project authority.
