import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createTemporaryRepository, type TemporaryRepository } from "./testing.js";
import { AtomicRepositoryWriter } from "./writer.js";

const repositories: TemporaryRepository[] = [];

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
});
