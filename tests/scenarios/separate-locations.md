# Separate-location entrypoint scenario

Fixture: [separate-locations.json](../fixtures/separate-locations.json)

Given DevCharter and an established target are at different absolute locations, when a companion is
given the fixture's five inputs, it can route to the Project Architect skill without installing,
copying, or executing DevCharter in the target. The target remains unchanged during discovery and
proposal work. This scenario validates entrypoint completeness and location independence only;
SPEC-0002B/C own full methodology and companion qualification.

`npm run verify` exercises this scenario in a clean temporary directory. It stages the DevCharter
source and a sentinel target in distinct roots, reads the root and Codex entrypoints, resolves the
Project Architect skill inside the staged source, compares the target's path/content hash before and
after routing, and removes the temporary environment.
