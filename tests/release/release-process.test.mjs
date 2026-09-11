import path from "node:path";
import os from "node:os";
import process from "node:process";

import { describe, expect, it } from "vitest";

import { releaseEnvironment, runFixedCommand } from "../../scripts/release-process.mjs";

describe("fixed release command runner", () => {
  it("reports an unavailable executable", () => {
    expect(() =>
      runFixedCommand({
        executable: path.join(process.cwd(), "missing-release-command"),
        args: [],
        cwd: process.cwd(),
        timeout: 1_000,
        label: "missing release command"
      })
    ).toThrow(/missing release command could not start/);
  });

  it("reports a non-zero exit with captured evidence", () => {
    expect(() =>
      runFixedCommand({
        executable: process.execPath,
        args: ["--eval", "process.stderr.write('expected evidence'); process.exit(7)"],
        cwd: process.cwd(),
        timeout: 1_000,
        label: "failing release command"
      })
    ).toThrow(/failing release command exited with status 7[\s\S]*expected evidence/);
  });

  it("reports a bounded timeout", () => {
    expect(() =>
      runFixedCommand({
        executable: process.execPath,
        args: ["--eval", "setTimeout(() => undefined, 10_000)"],
        cwd: process.cwd(),
        timeout: 25,
        label: "slow release command"
      })
    ).toThrow(/slow release command timed out after 25ms/);
  });

  it("uses only the controlled environment plus explicit additions", () => {
    expect(releaseEnvironment({ CI: "true" })).toEqual({
      PATH: process.env.PATH ?? "",
      SystemRoot: process.env.SystemRoot ?? "",
      TEMP: process.env.TEMP ?? os.tmpdir(),
      TMP: process.env.TMP ?? os.tmpdir(),
      NO_COLOR: "1",
      CI: "true"
    });
  });
});
