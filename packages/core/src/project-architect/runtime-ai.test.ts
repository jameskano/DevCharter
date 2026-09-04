import { describe, expect, it } from "vitest";

import {
  analyzeRuntimeAiEvidence,
  bindRuntimeAiFingerprintEvidence,
  sourceImports
} from "./runtime-ai.js";

function evidence(entries: Readonly<Record<string, string | undefined>>) {
  return analyzeRuntimeAiEvidence(
    new Map(
      Object.entries(entries).filter((entry): entry is [string, string] => entry[1] !== undefined)
    )
  );
}

describe("runtime-AI package authority", () => {
  it.each([
    {
      name: "same package declaration and import",
      entries: {
        "packages/a/package.json": '{"dependencies":{"openai":"1"}}',
        "packages/a/src/client.ts": 'import OpenAI from "openai";'
      },
      detected: true
    },
    {
      name: "sibling declaration cannot authorize an import",
      entries: {
        "packages/a/package.json": '{"dependencies":{"openai":"1"}}',
        "packages/b/src/client.ts": 'import OpenAI from "openai";'
      },
      detected: false
    },
    {
      name: "nearer empty package manifest blocks a root declaration",
      entries: {
        "package.json": '{"dependencies":{"openai":"1"}}',
        "packages/b/package.json": '{"name":"b"}',
        "packages/b/src/client.ts": 'import OpenAI from "openai";'
      },
      detected: false
    },
    {
      name: "root declaration governs a root source",
      entries: {
        "package.json": '{"dependencies":{"openai":"1"}}',
        "src/client.ts": 'import OpenAI from "openai";'
      },
      detected: true
    },
    {
      name: "root declaration governs nested source without nearer manifest",
      entries: {
        "package.json": '{"dependencies":{"openai":"1"}}',
        "packages/a/src/client.ts": 'import OpenAI from "openai";'
      },
      detected: true
    },
    {
      name: "a Python manifest cannot authorize JavaScript",
      entries: {
        "pyproject.toml": '[project]\ndependencies = ["openai"]',
        "src/client.ts": 'import OpenAI from "openai";'
      },
      detected: false
    }
  ])("resolves $name", ({ entries, detected }) => {
    const result = evidence(entries);
    expect(result.matchedDependencies.length > 0).toBe(detected);
    expect(result.matchedImportsBySource.size > 0).toBe(detected);
  });

  it("keeps declaration-only and import-only evidence unconfirmed", () => {
    const declared = evidence({ "package.json": '{"dependencies":{"openai":"1"}}' });
    expect(declared.matchedDependencies).toEqual([]);
    expect(declared.unmatchedDependencies.map((item) => item.name)).toEqual(["openai"]);

    const imported = evidence({ "src/client.ts": 'import OpenAI from "openai";' });
    expect(imported.matchedDependencies).toEqual([]);
    expect(imported.matchedImportsBySource.size).toBe(0);
  });

  it("is stable across input ordering and path separators", () => {
    const posix = evidence({
      "package.json": '{"dependencies":{"openai":"1"}}',
      "packages/a/src/client.ts": 'import OpenAI from "openai";'
    });
    const windowsReordered = evidence({
      "packages\\a\\src\\client.ts": 'import OpenAI from "openai";',
      "package.json": '{"dependencies":{"openai":"1"}}'
    });
    expect(windowsReordered).toEqual(posix);
    expect(
      bindRuntimeAiFingerprintEvidence("base", "packages\\a\\src\\client.ts", windowsReordered)
    ).toBe(bindRuntimeAiFingerprintEvidence("base", "packages/a/src/client.ts", posix));
  });
});

describe("JavaScript runtime-AI lexical masking", () => {
  it.each([
    ["line comment", '// import OpenAI from "openai";'],
    ["block comment", '/*\nimport OpenAI from "openai";\n*/'],
    ["single-quoted example", `const example = 'import OpenAI from "openai"';`],
    ["double-quoted example", `const example = "require('openai')";`],
    ["template example", 'const example = `import OpenAI from "openai"`;'],
    ["multiline template", 'const example = `first\nimport OpenAI from "openai"\nlast`;'],
    ["escaped quotes", `const example = 'import OpenAI from \\'openai\\'';`],
    ["escaped backtick", 'const example = `import("openai") \\` still text`;'],
    ["comment markers in string", `const example = "// import('openai') /* require('openai') */";`]
  ])("ignores %s", (_name, source) => {
    expect(sourceImports("src/client.ts", source)).toEqual([]);
  });

  it.each([
    ["static import", 'import OpenAI from "openai";'],
    ["side-effect import", 'import "openai";'],
    ["require", 'const OpenAI = require("openai");'],
    ["dynamic import", 'const OpenAI = await import("openai");'],
    ["template interpolation", 'const value = `${await import("openai")}`;']
  ])("recognizes %s", (_name, source) => {
    expect(sourceImports("src/client.ts", source)).toEqual(["openai"]);
  });

  it("keeps only the live import beside inactive examples", () => {
    expect(
      sourceImports(
        "src/client.ts",
        [
          '// import "@anthropic-ai/sdk";',
          'const example = `require("openai")`;',
          'import OpenAI from "openai";'
        ].join("\n")
      )
    ).toEqual(["openai"]);
  });
});
