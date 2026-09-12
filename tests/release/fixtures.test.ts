import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { runProjectArchitect } from "../../packages/core/src/project-architect.js";
import { afterEach, describe, expect, it } from "vitest";

import { releaseFixtures } from "./fixtures.js";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function materialize(files: Readonly<Record<string, string>>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "devcharter-release-fixture-"));
  roots.push(root);
  for (const [repositoryPath, content] of Object.entries(files)) {
    const target = path.join(root, ...repositoryPath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }
  return root;
}

describe("SPEC-0001E deterministic fixture catalog", () => {
  it("contains each of the twelve required conditions exactly once", () => {
    expect(releaseFixtures).toHaveLength(12);
    expect(new Set(releaseFixtures.map((fixture) => fixture.condition)).size).toBe(12);
  });

  it.each(releaseFixtures)("analyzes $condition deterministically", async (fixture) => {
    const root = await materialize(fixture.files);
    const first = await runProjectArchitect(root, { mode: "audit", scope: "full" });
    const second = await runProjectArchitect(root, { mode: "audit", scope: "full" });
    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining(fixture.expectedFindingCodes ?? [])
    );

    if (fixture.name === "nested-instructions") {
      expect(first.value.facts).toContainEqual(
        expect.objectContaining({ key: "ai.instructionAuthorities" })
      );
    }
    if (fixture.name === "skill-provenance") {
      expect(first.value.artifacts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ".agents/skills/local/SKILL.md", origin: "project" }),
          expect.objectContaining({ path: ".agents/skills/vendor/SKILL.md", origin: "third-party" })
        ])
      );
    }
    if (fixture.name === "developer-and-runtime-ai") {
      expect(first.value.facts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: "ai.developerConfiguration" }),
          expect.objectContaining({ key: "ai.unusedOrUnconfirmedDependencies" })
        ])
      );
    }
    if (fixture.name === "small-monorepo") {
      expect(first.value.artifacts.map((artifact) => artifact.path)).toEqual(
        expect.arrayContaining(["packages/a/package.json", "packages/b/package.json"])
      );
    }
  });
});
