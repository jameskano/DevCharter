import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { createTemporaryRepository, type TemporaryRepository } from "@devcharter/core/testing";
import { afterEach, describe, expect, it } from "vitest";

import { DEVCHARTER_VERSION, runCli, type CliIo } from "./index.js";

const execFileAsync = promisify(execFile);
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

function captureIo(cwd: string): { io: CliIo; stdout: string[]; stderr: string[] } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    io: {
      cwd,
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value)
    },
    stdout,
    stderr
  };
}

describe("exact CLI surface", () => {
  it("supports help and version output", async () => {
    const repository = await temporaryRepository();
    const help = captureIo(repository.root);
    await expect(runCli(["--help"], help.io)).resolves.toBe(0);
    expect(help.stdout.join("")).toContain("devcharter inspect");
    expect(help.stdout.join("")).toContain("devcharter validate");

    const version = captureIo(repository.root);
    await expect(runCli(["--version"], version.io)).resolves.toBe(0);
    expect(version.stdout.join("")).toBe("devcharter " + DEVCHARTER_VERSION + "\n");
  });

  it.each(["new", "retrofit", "audit", "check", "session", "generate", "apply", "migrate"])(
    "rejects the deferred or obsolete %s command",
    async (command) => {
      const repository = await temporaryRepository();
      const output = captureIo(repository.root);
      await expect(runCli([command], output.io)).resolves.toBe(2);
      expect(output.stderr.join("")).toContain("Unknown command");
    }
  );

  it("rejects positional repository arguments and unsupported formats", async () => {
    const repository = await temporaryRepository();
    const positional = captureIo(repository.root);
    await expect(runCli(["inspect", "../other"], positional.io)).resolves.toBe(2);
    expect(positional.stderr.join("")).toContain("Positional repository arguments");

    const format = captureIo(repository.root);
    await expect(runCli(["validate", "--format", "xml"], format.io)).resolves.toBe(2);
    expect(format.stderr.join("")).toContain("--format must be human or json");
  });
});

describe("read-only CLI behavior", () => {
  it("produces stable human inspect output without writing", async () => {
    const repository = await temporaryRepository({ "README.md": "project" });
    const before = await repository.snapshot();
    const output = captureIo(repository.root);

    await expect(runCli(["inspect"], output.io)).resolves.toBe(0);
    expect(output.stdout.join("")).toBe(
      "DevCharter inspect\nArtifacts: 1\n- README.md [documentation; project]\n"
    );
    expect(await repository.snapshot()).toEqual(before);
  });

  it("produces stable JSON validation output and preserves command order", async () => {
    const repository = await temporaryRepository({
      ".devcharter.yaml":
        "version: 1\nverificationCommands:\n  - name: typecheck\n    command: pnpm typecheck\n  - name: test\n    command: pnpm test\n"
    });
    const before = await repository.snapshot();
    const output = captureIo(repository.root);

    await expect(runCli(["validate", "--format", "json"], output.io)).resolves.toBe(0);
    expect(JSON.parse(output.stdout.join(""))).toMatchObject({
      command: "validate",
      formatVersion: 1,
      ok: true,
      result: {
        outcome: "pass",
        changedPaths: []
      }
    });
    expect(await repository.snapshot()).toEqual(before);
  });

  it("reports valid legacy YAML as a warning without writing", async () => {
    const repository = await temporaryRepository({ ".ai/legacy.yaml": "name: old" });
    const before = await repository.snapshot();
    const output = captureIo(repository.root);

    await expect(runCli(["validate"], output.io)).resolves.toBe(0);
    expect(output.stdout.join("")).toContain("Outcome: warning");
    expect(output.stdout.join("")).toContain("Explicit migration required for .ai/legacy.yaml");
    expect(await repository.snapshot()).toEqual(before);
  });

  it("reports malformed legacy YAML as a failure without writing", async () => {
    const repository = await temporaryRepository({ ".ai/broken.yaml": "value: [broken" });
    const before = await repository.snapshot();
    const output = captureIo(repository.root);

    await expect(runCli(["validate", "--format", "json"], output.io)).resolves.toBe(1);
    expect(JSON.parse(output.stdout.join(""))).toMatchObject({
      ok: false,
      result: { outcome: "fail" },
      errors: [{ code: "UNSAFE_YAML", path: ".ai/broken.yaml" }]
    });
    expect(await repository.snapshot()).toEqual(before);
  });
});

describe("built CLI integration", () => {
  it("runs from the current working directory without changing it", async () => {
    const repository = await temporaryRepository({ "package.json": "{}" });
    const before = await repository.snapshot();
    const cliPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
    const execution = await execFileAsync(
      process.execPath,
      [cliPath, "inspect", "--format", "json"],
      { cwd: repository.root, windowsHide: true }
    );

    expect(JSON.parse(execution.stdout)).toMatchObject({
      command: "inspect",
      ok: true,
      result: {
        artifacts: [{ path: "package.json", kind: "configuration", origin: "project" }]
      }
    });
    expect(execution.stderr).toBe("");
    expect(await repository.snapshot()).toEqual(before);
  });

  it("has no writer, network, telemetry, Commander, or minimatch dependency", async () => {
    const source = await readFile(new URL("./index.ts", import.meta.url), "utf8");
    const manifest = await readFile(new URL("../package.json", import.meta.url), "utf8");

    expect(source).not.toContain("@devcharter/core/writer");
    expect(source).not.toMatch(/node:(http|https|net)|\bfetch\s*\(|telemetry/i);
    expect(manifest).not.toMatch(/commander|minimatch/i);
  });
});
