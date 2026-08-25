import { describe, expect, it } from "vitest";

import { parseDevCharterConfig } from "./config.js";
import { parseSafeYaml } from "./safe-yaml.js";

describe("compact DevCharter configuration", () => {
  it("accepts the compact schema and preserves verification-command order", () => {
    const result = parseDevCharterConfig(`
version: 1
verificationCommands:
  - name: typecheck
    command: pnpm typecheck
  - name: test
    command: pnpm test
`);

    expect(result).toEqual({
      ok: true,
      value: {
        version: 1,
        verificationCommands: [
          { name: "typecheck", command: "pnpm typecheck" },
          { name: "test", command: "pnpm test" }
        ]
      }
    });
  });

  it.each([
    ["unsupported version", "version: 2"],
    ["unknown fields", "version: 1\naiTools: [codex]"],
    ["secret fields", "version: 1\napiKey: secret"],
    ["session fields", "version: 1\nsession: {}"],
    ["ranking fields", "version: 1\nqualityRanking: high"],
    ["capability matrices", "version: 1\ncapabilityMatrix: {}"],
    [
      "duplicate command names",
      "version: 1\nverificationCommands:\n  - name: test\n    command: pnpm test\n  - name: test\n    command: pnpm test:unit"
    ],
    [
      "multiline commands",
      "version: 1\nverificationCommands:\n  - name: test\n    command: |\n      pnpm test\n      pnpm lint"
    ]
  ])("rejects %s", (_name, source) => {
    expect(parseDevCharterConfig(source).ok).toBe(false);
  });
});

describe("safe YAML boundary", () => {
  it.each([
    ["duplicate keys", "version: 1\nversion: 1"],
    ["multiple documents", "version: 1\n---\nversion: 1"],
    ["custom tags", "version: !custom 1"],
    ["aliases", "base: &base value\ncopy: *base"],
    ["collection keys", "? [one, two]\n: value"],
    ["malformed input", "version: [1"]
  ])("rejects %s", (_name, source) => {
    const result = parseSafeYaml(source, "fixture.yaml");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.path).toBe("fixture.yaml");
  });
});
