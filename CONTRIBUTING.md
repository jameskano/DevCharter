# Contributing to DevCharter

DevCharter is a static instruction, knowledge, specification, template, and scenario system. It has
no product runtime. Read `AGENTS.md`, `MANIFEST.md`, the current product, architecture, and
engineering docs, and the one active implementation specification before substantial work.

## Make the smallest authoritative change

- Update the canonical shared skill or knowledge source instead of duplicating lifecycle rules in a
  companion adapter.
- Add technology or tool guidance only when maintained evidence, a concrete consumer, and a
  verification approach justify it. Record source date and limitations; do not freeze guessed
  versions or commands.
- Add or update a companion by documenting its native discovery surface, separate-location access,
  permissions, approval behavior, limitations, and official sources. Keep its adapter thin and route
  it to shared authority.
- Preserve historical specifications and release records as history. Never turn their CLI or JSON
  examples back into current instructions.
- Do not add empty catalogs, placeholder profiles, target dependencies, session state, telemetry,
  agents, hooks, MCP integrations, CI, or new tooling without specification evidence.

## Qualification

Update the affected fixture and walkthrough when behavior changes. Stable assertions may validate
required sections, approvals, effects, preservation, and prohibited actions; do not compare model
prose or layout byte-for-byte. Real-host evidence must name the companion and host version or date,
five inputs, stages exercised, changed and preserved paths, commands, actual results, limitations,
and review outcome without storing secrets or full private conversations.

Run:

```bash
npm run verify
git diff --check
```

Then inspect the complete diff and repository inventory. Record actual results and skips in the
active specification or release qualification record. A release transition additionally requires
all supported-host attempts and a fresh-context independent review; static success cannot waive a
release blocker.
