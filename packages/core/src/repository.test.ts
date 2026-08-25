import { mkdir, symlink } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { RepositoryReader } from "./repository.js";
import { createTemporaryRepository, type TemporaryRepository } from "./testing.js";

const repositories: TemporaryRepository[] = [];

async function temporaryRepository(
  files: Readonly<Record<string, string>> = {}
): Promise<TemporaryRepository> {
  const repository = await createTemporaryRepository(files);
  repositories.push(repository);
  return repository;
}

afterEach(async () => {
  await Promise.all(repositories.splice(0).map((repository) => repository.cleanup()));
});

async function readerFor(repository: TemporaryRepository): Promise<RepositoryReader> {
  const result = await RepositoryReader.create(repository.root);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

describe("RepositoryReader", () => {
  it("reads contained files and rejects traversal and absolute path forms", async () => {
    const repository = await temporaryRepository({ "docs/readme.md": "safe" });
    const reader = await readerFor(repository);

    await expect(reader.readText("docs/readme.md")).resolves.toEqual({
      ok: true,
      value: "safe"
    });

    for (const unsafePath of [
      "../outside.txt",
      "../devcharter-test-sibling/outside.txt",
      "/absolute.txt",
      "C:drive-relative.txt",
      "C:\\outside.txt",
      "\\\\server\\share\\file.txt"
    ]) {
      const result = await reader.readText(unsafePath);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("PATH_OUTSIDE_ROOT");
    }
  });

  it("inventories deterministically while classifying ignored material", async () => {
    const repository = await temporaryRepository({
      "zeta.ts": "export {};",
      "src/example.test.ts": "export {};",
      "docs/readme.md": "docs",
      "node_modules/vendor/package.json": "{}",
      "dist/output.js": "generated",
      "ignored/private.txt": "ignored"
    });
    const reader = await readerFor(repository);
    const result = await reader.inventory({ ignoredPathPrefixes: ["ignored"] });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((artifact) => artifact.path)).toEqual([
      "dist",
      "docs/readme.md",
      "ignored",
      "node_modules",
      "src/example.test.ts",
      "zeta.ts"
    ]);
    expect(result.value.find((artifact) => artifact.path === "node_modules")).toMatchObject({
      kind: "dependency-directory",
      origin: "third-party"
    });
    expect(result.value.find((artifact) => artifact.path === "dist")).toMatchObject({
      kind: "generated-directory",
      origin: "generated-vendor"
    });
  });

  it("does not follow symbolic links", async () => {
    const repository = await temporaryRepository();
    const outside = await temporaryRepository({ "secret.txt": "outside" });
    const linkPath = path.join(repository.root, "escape");
    await mkdir(path.dirname(linkPath), { recursive: true });
    await symlink(outside.root, linkPath, process.platform === "win32" ? "junction" : "dir");

    const reader = await readerFor(repository);
    const inventory = await reader.inventory();
    expect(inventory.ok).toBe(true);
    if (inventory.ok) {
      expect(inventory.value).toContainEqual({
        path: "escape",
        kind: "symbolic-link",
        origin: "unknown"
      });
    }

    const read = await reader.readText("escape/secret.txt");
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.error.code).toBe("SYMLINK_ESCAPE");
  });
});
