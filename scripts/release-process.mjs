import { spawnSync } from "node:child_process";
import os from "node:os";
import process from "node:process";

export function releaseEnvironment(additions = {}) {
  return {
    PATH: process.env.PATH ?? "",
    SystemRoot: process.env.SystemRoot ?? "",
    TEMP: process.env.TEMP ?? os.tmpdir(),
    TMP: process.env.TMP ?? os.tmpdir(),
    NO_COLOR: "1",
    ...additions
  };
}

export function runFixedCommand({ executable, args, cwd, timeout, label, env }) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    env: env ?? releaseEnvironment(),
    timeout,
    windowsHide: true
  });
  if (result.error === undefined && result.status === 0) return result.stdout ?? "";

  const reason =
    result.error?.code === "ETIMEDOUT"
      ? ` timed out after ${timeout}ms`
      : result.error !== undefined
        ? ` could not start: ${result.error.message}`
        : ` exited with status ${String(result.status)}`;
  throw new Error(
    `${label}${reason}\n${result.stdout ?? ""}${result.stderr ?? ""}`,
    result.error === undefined ? undefined : { cause: result.error }
  );
}
