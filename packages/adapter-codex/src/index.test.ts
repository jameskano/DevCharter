import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { codexAdapter, loadPackagedSkill } from "./index.js";

describe("portable Codex assets", () => {
  it.each(["project-architect", "specification-architect"])(
    "packages the canonical %s skill without a repository-root runtime lookup",
    async (name) => {
      const canonical = await readFile(
        fileURLToPath(new URL(`../../../.agents/skills/${name}/SKILL.md`, import.meta.url)),
        "utf8"
      );
      const packaged = await loadPackagedSkill(name);
      expect(packaged).toEqual({ ok: true, value: canonical });
      const runtimeSource = await readFile(new URL("./index.ts", import.meta.url), "utf8");
      expect(runtimeSource).not.toContain(".agents/skills");
      expect(runtimeSource).not.toContain("repositoryRoot");
    }
  );

  it("creates package scripts in canonical order without inventing manifest fields", async () => {
    const result = await codexAdapter.renderChange({
      proposal: {
        acceptedDecisions: [
          { id: "project.packageScripts", value: { typecheck: "tsc --noEmit", test: "vitest run" } }
        ]
      } as never,
      change: { path: "package.json" } as never
    });
    expect(result).toEqual({
      ok: true,
      value:
        '{\n  "scripts": {\n    "test": "vitest run",\n    "typecheck": "tsc --noEmit"\n  }\n}\n'
    });
  });

  it("surgically updates package scripts while preserving existing order and fields", async () => {
    const result = await codexAdapter.renderChange({
      proposal: {
        acceptedDecisions: [
          { id: "project.packageScripts", value: { lint: "eslint .", test: "vitest run" } }
        ]
      } as never,
      change: { path: "package.json" } as never,
      existingContent:
        '{\n  "name": "demo",\n  "scripts": {\n    "test": "old",\n    "build": "tsc"\n  },\n  "private": true\n}\n'
    });
    expect(result).toEqual({
      ok: true,
      value:
        '{\n  "name": "demo",\n  "scripts": {\n    "test": "vitest run",\n    "build": "tsc",\n    "lint": "eslint ."\n  },\n  "private": true\n}\n'
    });
  });

  it.each([
    '{"name":"one","name":"two"}',
    '{"scripts":{},"scripts":{}}',
    '{"scripts":[]}',
    '{// comment\n"scripts":{}}',
    '{"scripts":{},}'
  ])("rejects malformed or ambiguous package JSON: %s", async (existingContent) => {
    const result = await codexAdapter.renderChange({
      proposal: {
        acceptedDecisions: [{ id: "project.packageScripts", value: { test: "vitest run" } }]
      } as never,
      change: { path: "package.json" } as never,
      existingContent
    });
    expect(result).toMatchObject({ ok: false, error: { code: "INVALID_ARGUMENT" } });
  });
});
