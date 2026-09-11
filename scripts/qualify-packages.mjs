import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

import { releaseEnvironment, runFixedCommand } from "./release-process.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const packageManager = process.env.npm_execpath;
if (packageManager === undefined) {
  throw new Error("package qualification must be launched through pnpm");
}

function runPnpm(arguments_, cwd, timeout = 120_000) {
  return runFixedCommand({
    executable: process.execPath,
    args: [packageManager, ...arguments_],
    cwd,
    timeout,
    label: `pnpm ${arguments_.join(" ")}`,
    env: releaseEnvironment({ CI: "true" })
  });
}

function runTar(arguments_, cwd) {
  return runFixedCommand({
    executable: "tar",
    args: arguments_,
    cwd,
    timeout: 30_000,
    label: `tar ${arguments_.join(" ")}`
  });
}

function runNode(arguments_, cwd, timeout = 30_000, additions = {}) {
  return runFixedCommand({
    executable: process.execPath,
    args: arguments_,
    cwd,
    timeout,
    label: `node ${arguments_.join(" ")}`,
    env: releaseEnvironment(additions)
  });
}

function parseSuccessfulEnvelope(source, command) {
  const envelope = JSON.parse(source);
  if (envelope?.ok !== true || envelope.command !== command || envelope.result === undefined) {
    throw new Error(`installed ${command} did not return a successful JSON envelope`);
  }
  return envelope;
}

const packageDirectories = ["packages/core", "packages/adapter-codex", "packages/cli"];
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "devcharter-package-qualification-"));

try {
  runPnpm(["build"], repositoryRoot);
  const artifacts = path.join(temporaryRoot, "artifacts");
  const installation = path.join(temporaryRoot, "installation");
  await mkdir(artifacts);
  await mkdir(installation);

  for (const directory of packageDirectories) {
    runPnpm(["--dir", directory, "pack", "--pack-destination", artifacts], repositoryRoot);
  }

  const tarballs = (await readdir(artifacts)).filter((name) => name.endsWith(".tgz")).sort();
  if (tarballs.length !== 3) throw new Error(`expected three tarballs, found ${tarballs.length}`);

  const contents = {};
  for (const tarball of tarballs) {
    const tarballPath = path.join(artifacts, tarball);
    const entries = runTar(["-tf", tarballPath], repositoryRoot)
      .split(/\r?\n/)
      .filter(Boolean)
      .sort();
    const forbidden = entries.filter(
      (entry) =>
        /(^|\/)(src|scripts|prompts|specs|tests?|fixtures|snapshots?)(\/|$)/i.test(entry) ||
        /\.(?:test|spec)\.[^/]+$/i.test(entry) ||
        /(?:^|\/)\.tsbuildinfo$/i.test(entry) ||
        /tsconfig|vitest|eslint|prettier/i.test(entry)
    );
    const unexpected = entries.filter(
      (entry) => entry !== "package/package.json" && !entry.startsWith("package/dist/")
    );
    if (forbidden.length > 0 || unexpected.length > 0) {
      throw new Error(
        `${tarball} contains development-only or unexpected material: ${[
          ...forbidden,
          ...unexpected
        ].join(", ")}`
      );
    }
    const manifestSource = runTar(["-xOf", tarballPath, "package/package.json"], repositoryRoot);
    const manifest = JSON.parse(manifestSource);
    if (manifest.private === true) throw new Error(`${tarball} is still private`);
    if (JSON.stringify(manifest).includes("workspace:")) {
      throw new Error(`${tarball} retains a workspace dependency`);
    }
    contents[tarball] = entries;
    await copyFile(tarballPath, path.join(installation, tarball));
  }

  const byPackage = Object.fromEntries(
    tarballs.map((tarball) => {
      const name = tarball.includes("adapter-codex")
        ? "@devcharter/adapter-codex"
        : tarball.includes("cli")
          ? "@devcharter/cli"
          : "@devcharter/core";
      return [name, `file:./${tarball}`];
    })
  );
  await writeFile(
    path.join(installation, "package.json"),
    JSON.stringify(
      {
        private: true,
        type: "module",
        dependencies: byPackage,
        pnpm: { overrides: byPackage }
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  runPnpm(["install", "--prefer-offline", "--ignore-scripts"], installation);

  const cliPath = path.join(installation, "node_modules", "@devcharter", "cli", "dist", "cli.js");
  const installedVersion = runNode([cliPath, "--version"], installation).trim();
  if (installedVersion !== "devcharter 0.1.0") {
    throw new Error(`installed CLI failed: ${installedVersion}`);
  }

  const sourceSentinel = path.join(
    repositoryRoot,
    ".agents",
    "skills",
    "project-architect",
    "SKILL.md"
  );
  const permissionFlag =
    Number(process.versions.node.split(".")[0]) >= 22
      ? "--permission"
      : "--experimental-permission";
  const installationRoot = await realpath(installation);
  const readableRoots = new Set([installation, installationRoot]);
  const assetCheckSource = [
    "import { readFile } from 'node:fs/promises';",
    "import { loadPackagedSkill } from '@devcharter/adapter-codex';",
    "let sourceDenied = false;",
    "try { await readFile(process.env.DEVCHARTER_SOURCE_SENTINEL, 'utf8'); }",
    "catch (error) { sourceDenied = error?.code === 'ERR_ACCESS_DENIED'; }",
    "if (!sourceDenied) throw new Error('source checkout remained readable');",
    "const names = ['project-architect', 'specification-architect'];",
    "for (const name of names) {",
    "  const result = await loadPackagedSkill(name);",
    "  if (!result.ok || !result.value.includes(`name: ${name}`)) throw new Error(`missing packaged ${name}`);",
    "}",
    "process.stdout.write(import.meta.resolve('@devcharter/adapter-codex'));"
  ].join("\n");
  const resolvedAdapter = runNode(
    [
      permissionFlag,
      ...[...readableRoots].map((root) => `--allow-fs-read=${root}`),
      "--input-type=module",
      "--eval",
      assetCheckSource
    ],
    installation,
    30_000,
    { DEVCHARTER_SOURCE_SENTINEL: sourceSentinel }
  );
  const resolvedAdapterPath = fileURLToPath(resolvedAdapter.trim());
  const resolvesInsideInstallation = [...readableRoots].some((root) => {
    const relativePath = path.relative(root, resolvedAdapterPath);
    return (
      relativePath !== ".." &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath)
    );
  });
  if (!resolvesInsideInstallation) {
    throw new Error("installed adapter resolved outside the temporary installation");
  }

  const lockfile = await readFile(path.join(installation, "pnpm-lock.yaml"), "utf8");
  if (lockfile.includes("workspace:"))
    throw new Error("fresh installation retained workspace links");

  const lifecycleTarget = path.join(installation, "lifecycle-target");
  const lifecycleInputs = path.join(installation, "lifecycle-inputs");
  await mkdir(lifecycleTarget);
  await mkdir(lifecycleInputs);
  const decisionsPath = path.join(lifecycleInputs, "decisions.json");
  await writeFile(
    decisionsPath,
    JSON.stringify([
      { id: "project.outcome", value: "Qualify the installed DevCharter CLI" },
      { id: "project.aiTools", value: ["Codex"] },
      { id: "project.constraints", value: [] },
      { id: "project.risks", value: [] }
    ]),
    "utf8"
  );
  const proposedSource = runNode(
    [cliPath, "new", "--scope", "ai", "--decisions", decisionsPath, "--format", "json"],
    lifecycleTarget
  );
  const proposed = parseSuccessfulEnvelope(proposedSource, "new");
  const proposalPath = path.join(lifecycleInputs, "proposal-envelope.json");
  await writeFile(proposalPath, proposedSource, "utf8");
  const proposal = proposed.result.proposal;
  const abstractApprovalPath = path.join(lifecycleInputs, "abstract-approval.json");
  await writeFile(
    abstractApprovalPath,
    JSON.stringify({
      stage: "abstract",
      confirmed: true,
      proposalRevision: proposal.revision,
      proposalFingerprint: proposal.proposalFingerprint,
      repositoryFingerprint: proposal.repositoryFingerprint
    }),
    "utf8"
  );
  const renderedSource = runNode(
    [
      cliPath,
      "render",
      "--proposal",
      proposalPath,
      "--approval",
      abstractApprovalPath,
      "--adapter",
      "codex",
      "--format",
      "json"
    ],
    lifecycleTarget
  );
  const rendered = parseSuccessfulEnvelope(renderedSource, "render");
  const planPath = path.join(lifecycleInputs, "render-envelope.json");
  await writeFile(planPath, renderedSource, "utf8");
  const writeApprovalPath = path.join(lifecycleInputs, "write-approval.json");
  await writeFile(
    writeApprovalPath,
    JSON.stringify({
      stage: "write",
      confirmed: true,
      proposalRevision: rendered.result.revision,
      renderedFingerprint: rendered.result.renderedFingerprint,
      repositoryFingerprint: rendered.result.repositoryFingerprint
    }),
    "utf8"
  );
  const applyArguments = [
    cliPath,
    "apply",
    "--plan",
    planPath,
    "--approval",
    writeApprovalPath,
    "--format",
    "json"
  ];
  const applied = parseSuccessfulEnvelope(runNode(applyArguments, lifecycleTarget), "apply");
  const validated = parseSuccessfulEnvelope(
    runNode([cliPath, "validate", "--format", "json"], lifecycleTarget),
    "validate"
  );
  const retried = parseSuccessfulEnvelope(runNode(applyArguments, lifecycleTarget), "apply");
  if (applied.result.outcome !== "applied" || validated.result.outcome !== "pass") {
    throw new Error("installed lifecycle did not apply and validate successfully");
  }
  if (retried.result.outcome !== "already-applied" || retried.result.changedPaths.length !== 0) {
    throw new Error("installed lifecycle retry was not an exact no-op");
  }

  process.stdout.write(
    JSON.stringify(
      {
        outcome: "pass",
        node: process.version,
        platform: process.platform,
        tarballs: contents,
        installedCli: installedVersion,
        installedLifecycle: {
          proposal: "new/ai",
          approvalGates: 2,
          applyOutcome: applied.result.outcome,
          validationOutcome: validated.result.outcome,
          retryOutcome: retried.result.outcome
        },
        packagedAssets: ["project-architect", "specification-architect"],
        sourceCheckoutRead: "denied"
      },
      null,
      2
    ) + "\n"
  );
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
