import { createHash } from "node:crypto";
import { readFile, readdir, symlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createTemporaryRepository, type TemporaryRepository } from "./testing.js";
import { AtomicRepositoryWriter } from "./writer.js";

const repositories: TemporaryRepository[] = [];

function hashText(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

afterEach(async () => {
  await Promise.all(repositories.splice(0).map((repository) => repository.cleanup()));
});

async function temporaryRepository(
  files: Readonly<Record<string, string>> = {}
): Promise<TemporaryRepository> {
  const repository = await createTemporaryRepository(files);
  repositories.push(repository);
  return repository;
}

describe("AtomicRepositoryWriter", () => {
  it("creates and updates contained files atomically", async () => {
    const repository = await temporaryRepository();
    const writerResult = await AtomicRepositoryWriter.create(repository.root);
    expect(writerResult.ok).toBe(true);
    if (!writerResult.ok) return;

    await expect(writerResult.value.writeText("nested/file.txt", "first")).resolves.toEqual({
      ok: true,
      value: { path: "nested/file.txt", action: "create", bytes: 5 }
    });
    await expect(writerResult.value.writeText("nested/file.txt", "second")).resolves.toEqual({
      ok: true,
      value: { path: "nested/file.txt", action: "update", bytes: 6 }
    });
    await expect(readFile(path.join(repository.root, "nested/file.txt"), "utf8")).resolves.toBe(
      "second"
    );
  });

  it("rejects writes outside the repository", async () => {
    const repository = await temporaryRepository();
    const writerResult = await AtomicRepositoryWriter.create(repository.root);
    if (!writerResult.ok) throw new Error(writerResult.error.message);

    const write = await writerResult.value.writeText("../outside.txt", "unsafe");
    expect(write.ok).toBe(false);
    if (!write.ok) expect(write.error.code).toBe("PATH_OUTSIDE_ROOT");
  });

  it("rejects writes through symbolic links", async () => {
    const repository = await temporaryRepository();
    const outside = await temporaryRepository();
    await symlink(
      outside.root,
      path.join(repository.root, "escape"),
      process.platform === "win32" ? "junction" : "dir"
    );
    const writerResult = await AtomicRepositoryWriter.create(repository.root);
    if (!writerResult.ok) throw new Error(writerResult.error.message);

    const write = await writerResult.value.writeText("escape/outside.txt", "unsafe");
    expect(write.ok).toBe(false);
    if (!write.ok) expect(write.error.code).toBe("SYMLINK_ESCAPE");
    await expect(outside.snapshot()).resolves.toEqual([]);
  });

  it("cleans temporary files and preserves the target after a pre-rename failure", async () => {
    const repository = await temporaryRepository({ "target.txt": "original" });
    const before = await repository.snapshot();
    const writerResult = await AtomicRepositoryWriter.create(repository.root, {
      beforeRename: async () => {
        throw new Error("injected rename failure");
      }
    });
    if (!writerResult.ok) throw new Error(writerResult.error.message);

    const write = await writerResult.value.writeText("target.txt", "replacement");
    expect(write.ok).toBe(false);
    if (!write.ok) {
      expect(write.error.code).toBe("ATOMIC_WRITE_FAILED");
      expect(write.error.details).toMatchObject({
        stage: "before-rename",
        cleanupSucceeded: true
      });
    }
    expect(await repository.snapshot()).toEqual(before);
    expect((await readdir(repository.root)).filter((name) => name.endsWith(".tmp"))).toEqual([]);
  });

  it("reports parent-directory creation when a new nested write fails", async () => {
    const repository = await temporaryRepository();
    const writerResult = await AtomicRepositoryWriter.create(repository.root, {
      beforeRename: async () => {
        throw new Error("injected rename failure");
      }
    });
    if (!writerResult.ok) throw new Error(writerResult.error.message);

    const write = await writerResult.value.writeText("new/nested.txt", "replacement");
    expect(write.ok).toBe(false);
    if (!write.ok) {
      expect(write.error.details).toMatchObject({
        stage: "before-rename",
        cleanupSucceeded: true,
        parentCreated: true
      });
    }
    expect(
      (await readdir(path.join(repository.root, "new"))).filter((name) => name.endsWith(".tmp"))
    ).toEqual([]);
  });

  it("preserves a target changed after preflight", async () => {
    const original = "original";
    const concurrent = "concurrent user change";
    const repository = await temporaryRepository({ "target.txt": original });
    const writerResult = await AtomicRepositoryWriter.create(repository.root, {
      beforeRename: async () => writeFile(path.join(repository.root, "target.txt"), concurrent)
    });
    if (!writerResult.ok) throw new Error(writerResult.error.message);

    const write = await writerResult.value.writeText("target.txt", "replacement", {
      expected: "present",
      baselineHash: hashText(original)
    });

    expect(write).toMatchObject({ ok: false, error: { code: "STALE_PROPOSAL" } });
    await expect(readFile(path.join(repository.root, "target.txt"), "utf8")).resolves.toBe(
      concurrent
    );
    expect((await readdir(repository.root)).filter((name) => name.endsWith(".tmp"))).toEqual([]);
  });

  it("preserves a target created after preflight", async () => {
    const concurrent = "concurrent user creation";
    const repository = await temporaryRepository();
    const writerResult = await AtomicRepositoryWriter.create(repository.root, {
      beforeRename: async () => writeFile(path.join(repository.root, "target.txt"), concurrent)
    });
    if (!writerResult.ok) throw new Error(writerResult.error.message);

    const write = await writerResult.value.writeText("target.txt", "replacement", {
      expected: "absent"
    });

    expect(write).toMatchObject({ ok: false, error: { code: "STALE_PROPOSAL" } });
    await expect(readFile(path.join(repository.root, "target.txt"), "utf8")).resolves.toBe(
      concurrent
    );
    expect((await readdir(repository.root)).filter((name) => name.endsWith(".tmp"))).toEqual([]);
  });
});
