import { afterEach, describe, expect, it } from "vitest";

import { inspectLegacyConfiguration } from "./legacy.js";
import { readOptionalDevCharterConfig } from "./read-only.js";
import { RepositoryReader } from "./repository.js";
import { createTemporaryRepository, type TemporaryRepository } from "./testing.js";

const repositories: TemporaryRepository[] = [];

afterEach(async () => {
  await Promise.all(repositories.splice(0).map((repository) => repository.cleanup()));
});

async function inspect(files: Readonly<Record<string, string>>) {
  const repository = await createTemporaryRepository(files);
  repositories.push(repository);
  const readerResult = await RepositoryReader.create(repository.root);
  if (!readerResult.ok) throw new Error(readerResult.error.message);
  const before = await repository.snapshot();
  const report = await inspectLegacyConfiguration(readerResult.value);
  const after = await repository.snapshot();
  return { repository, reader: readerResult.value, before, report, after };
}

describe("legacy configuration compatibility", () => {
  it("reports valid legacy YAML as requiring explicit migration without writing", async () => {
    const result = await inspect({ ".ai/project.yaml": "name: legacy" });
    expect(result.report).toEqual({
      ok: true,
      value: {
        files: [
          {
            path: ".ai/project.yaml",
            parsed: true,
            migrationRequired: true
          }
        ],
        migrationRequired: true
      }
    });
    expect(result.after).toEqual(result.before);
  });

  it("preserves malformed legacy parse errors and performs no writes", async () => {
    const result = await inspect({ ".ai/broken.yaml": "value: [broken" });
    expect(result.report.ok).toBe(true);
    if (result.report.ok) {
      expect(result.report.value.files[0]).toMatchObject({
        path: ".ai/broken.yaml",
        parsed: false,
        migrationRequired: true,
        error: { code: "UNSAFE_YAML", path: ".ai/broken.yaml" }
      });
    }
    expect(result.after).toEqual(result.before);
  });

  it("accepts repositories without configuration or legacy profiles", async () => {
    const result = await inspect({});
    expect(result.report).toEqual({
      ok: true,
      value: { files: [], migrationRequired: false }
    });
    await expect(readOptionalDevCharterConfig(result.reader)).resolves.toEqual({
      ok: true,
      value: { present: false }
    });
    expect(result.after).toEqual(result.before);
  });
});
