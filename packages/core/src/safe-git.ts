import { execFile } from "node:child_process";

export const SAFE_GIT_PREFIX = [
  "--no-optional-locks",
  "--no-pager",
  "-c",
  "core.fsmonitor=false",
  "-c",
  "core.untrackedCache=false"
] as const;

export function executeSafeGit(root: string, arguments_: readonly string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      [...arguments_],
      {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          GIT_OPTIONAL_LOCKS: "0",
          GIT_TERMINAL_PROMPT: "0",
          LC_ALL: "C"
        },
        maxBuffer: 1024 * 1024,
        timeout: 5000,
        windowsHide: true
      },
      (error, stdout) => (error ? reject(error) : resolve(stdout))
    );
  });
}
