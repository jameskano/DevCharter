# Quality and decision model

## Quality without a scorecard

DevCharter does not require every project or specification to rate a long list of qualities.

Every project needs sensible baselines for correctness, safety, maintainability, and verifiability. Other concerns—such as security, privacy, accessibility, reliability, performance, cost, portability, scalability, or operations—are recorded only when they materially affect the project or current development.

## Development assessment

For non-trivial work, record only:

- qualities that are critical or unusually important;
- material risks;
- accepted and rejected trade-offs;
- resulting verification requirements.

Avoid numeric scoring unless a later feature demonstrates that it improves decisions.

## Evidence and confidence

Important discovered facts include their source and, when inferred, confidence.

Separate:

- confirmed facts;
- reasonable inferences;
- assumptions;
- open questions;
- rejected options.

Do not turn low-confidence heuristics into generated policy.

## Decision precedence

Use:

1. explicit current instruction;
2. applicable approved or active spec;
3. accepted project decision;
4. current project documentation;
5. relevant implementation and tests;
6. established repository convention;
7. conservative reversible default;
8. ask or mark unresolved.

If two authoritative-looking sources disagree, report the conflict rather than choosing silently.

## Assumptions

Material assumptions state:

- what is assumed;
- the supporting evidence;
- impact if wrong;
- whether the decision is reversible;
- whether confirmation is required.

Sensitive or irreversible behavior is never silently assumed.

## Shared responsibility

The user reports external decisions and service changes that the repository cannot reveal.

Codex inspects accessible relevant Git state, specs, docs, implementation, tests, dependencies, and commands. It warns about inconsistencies without scanning the entire repository continuously.

## Approval

Approval is lightweight. A proposal or spec becomes approved only through explicit human confirmation. AI may recommend approval but cannot grant it.

If the repository changes materially after approval, refresh the affected proposal before applying it.

## Status model

```text
draft
ready
active
done
cancelled
```

Review severities, validation outcomes, and temporary blockers are separate from development status.
