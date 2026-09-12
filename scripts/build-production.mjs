import { spawnSync } from "node:child_process";
import { chmod, readdir, rm } from "node:fs/promises";
import process from "node:process";
import { URL } from "node:url";

async function makeWritable(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const target = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) await makeWritable(target);
    await chmod(target, 0o700).catch(() => undefined);
  }
  await chmod(directory, 0o700).catch(() => undefined);
}

const repositoryRoot = new URL("../", import.meta.url);
for (const name of ["core", "adapter-codex", "cli"]) {
  const output = new URL(`packages/${name}/dist/`, repositoryRoot);
  await makeWritable(output);
  await rm(output, { recursive: true, force: true });
}

const compile = spawnSync(
  process.execPath,
  ["node_modules/typescript/bin/tsc", "-b", "tsconfig.build.json", "--force", "--pretty", "false"],
  { cwd: repositoryRoot, stdio: "inherit", windowsHide: true }
);
if (compile.status !== 0) process.exit(compile.status ?? 1);

const assets = spawnSync(process.execPath, ["packages/adapter-codex/scripts/prepare-assets.mjs"], {
  cwd: repositoryRoot,
  stdio: "inherit",
  windowsHide: true
});
if (assets.status !== 0) process.exit(assets.status ?? 1);
