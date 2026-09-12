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

  it("keeps ambiguous nested dependency-named directories as project material", async () => {
    const repository = await temporaryRepository({
      "vendor/root-dependency.js": "third party",
      "app/vendor/local.ts": "export const local = true;",
      "src/vendor/index.ts": "export const adapter = true;",
      "packages/unproven/vendor/local.ts": "export const localPackageCode = true;",
      "packages/app/package.json": '{"name":"app"}',
      "packages/app/vendor/dependency.js": "third party"
    });
    const reader = await readerFor(repository);
    const result = await reader.inventory();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContainEqual({
      path: "app/vendor/local.ts",
      kind: "source",
      origin: "project"
    });
    expect(result.value).toContainEqual({
      path: "src/vendor/index.ts",
      kind: "source",
      origin: "project"
    });
    expect(result.value).toContainEqual({
      path: "packages/unproven/vendor/local.ts",
      kind: "source",
      origin: "project"
    });
    expect(result.value).toContainEqual({
      path: "vendor",
      kind: "dependency-directory",
      origin: "third-party"
    });
    expect(result.value).toContainEqual({
      path: "packages/app/vendor",
      kind: "dependency-directory",
      origin: "third-party"
    });
  });

  it("classifies polyglot source and tests without treating JavaScript configuration as source", async () => {
    const repository = await temporaryRepository({
      "eslint.config.js": "export default [];",
      "build.gradle.kts": 'plugins { kotlin("jvm") }',
      "src/main.py": "def main(): pass",
      "src/lib.rs": "pub fn value() -> u8 { 1 }",
      "src/main.go": "package main",
      "src/App.java": "class App {}",
      "src/App.kt": "class App",
      "tests/test_main.py": "def test_main(): pass",
      "src/main_test.go": "package main"
    });
    const reader = await readerFor(repository);
    const result = await reader.inventory();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.find((item) => item.path === "eslint.config.js")?.kind).toBe(
      "configuration"
    );
    expect(result.value.find((item) => item.path === "build.gradle.kts")?.kind).toBe(
      "configuration"
    );
    for (const sourcePath of [
      "src/main.py",
      "src/lib.rs",
      "src/main.go",
      "src/App.java",
      "src/App.kt"
    ]) {
      expect(result.value.find((item) => item.path === sourcePath)?.kind).toBe("source");
    }
    for (const testPath of ["tests/test_main.py", "src/main_test.go"]) {
      expect(result.value.find((item) => item.path === testPath)?.kind).toBe("test");
    }
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
