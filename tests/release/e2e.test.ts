import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  readlink,
  realpath,
  rm,
  symlink,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const cliPath =
  process.env.DEVCHARTER_E2E_CLI_PATH ??
  path.join(repositoryRoot, "packages", "cli", "dist", "cli.js");
const temporaryRoots: string[] = [];

interface CliEnvelope {
  ok: boolean;
  result?: Record<string, unknown>;
  errors?: { code: string; message: string }[];
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

async function temporaryDirectory(prefix: string): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix));
  temporaryRoots.push(root);
  return root;
}

async function writeRepositoryFiles(
  root: string,
  files: Readonly<Record<string, string>>
): Promise<void> {
  for (const [repositoryPath, content] of Object.entries(files)) {
    const target = path.join(root, ...repositoryPath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }
}

async function runProgram(
  executable: string,
  args: readonly string[],
  cwd: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const result = await execFileAsync(executable, [...args], {
      cwd,
      encoding: "utf8",
      timeout: 20_000,
      windowsHide: true,
      env: {
        PATH: process.env.PATH ?? "",
        SystemRoot: process.env.SystemRoot ?? "",
        TEMP: process.env.TEMP ?? os.tmpdir(),
        TMP: process.env.TMP ?? os.tmpdir(),
        NO_COLOR: "1"
      }
    });
    return { ...result, exitCode: 0 };
  } catch (error) {
    const failure = error as Error & { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: failure.stdout ?? "",
      stderr: failure.stderr ?? failure.message,
      exitCode: typeof failure.code === "number" ? failure.code : 1
    };
  }
}

async function runCli(root: string, args: readonly string[]): Promise<CliEnvelope> {
  const { stdout } = await runProgram(process.execPath, [cliPath, ...args], root);
  return JSON.parse(stdout) as CliEnvelope;
}

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected an object");
  }
  return value as Record<string, unknown>;
}

async function writeJson(root: string, name: string, value: unknown): Promise<string> {
  const target = path.join(root, name);
  await writeFile(target, JSON.stringify(value, null, 2) + "\n", "utf8");
  return target;
}

async function completeLifecycle(
  mode: "new" | "retrofit",
  scope: "full" | "ai",
  files: Readonly<Record<string, string>>,
  decisions: readonly Record<string, unknown>[]
) {
  const target = await temporaryDirectory("devcharter-release-target-");
  const artifacts = await temporaryDirectory("devcharter-release-artifacts-");
  await writeRepositoryFiles(target, files);
  const effectiveDecisions =
    mode === "retrofit" ? [...decisions, { id: "project.mode", value: "retrofit" }] : decisions;
  const decisionsPath = await writeJson(artifacts, "decisions.json", effectiveDecisions);
  const proposalEnvelope = await runCli(target, [
    mode,
    "--scope",
    scope,
    "--decisions",
    decisionsPath,
    "--format",
    "json"
  ]);
  expect(proposalEnvelope.ok).toBe(true);
  const proposal = record(record(proposalEnvelope.result).proposal);
  const proposalPath = await writeJson(artifacts, "proposal-envelope.json", proposalEnvelope);
  const abstractApproval = await writeJson(artifacts, "abstract-approval.json", {
    stage: "abstract",
    confirmed: true,
    proposalRevision: proposal.revision,
    proposalFingerprint: proposal.proposalFingerprint,
    repositoryFingerprint: proposal.repositoryFingerprint
  });
  const renderedEnvelope = await runCli(target, [
    "render",
    "--proposal",
    proposalPath,
    "--approval",
    abstractApproval,
    "--adapter",
    "codex",
    "--format",
    "json"
  ]);
  expect(renderedEnvelope.ok, JSON.stringify(renderedEnvelope)).toBe(true);
  const plan = record(renderedEnvelope.result);
  const planPath = await writeJson(artifacts, "render-envelope.json", renderedEnvelope);
  const writeApproval = await writeJson(artifacts, "write-approval.json", {
    stage: "write",
    confirmed: true,
    proposalRevision: plan.revision,
    renderedFingerprint: plan.renderedFingerprint,
    repositoryFingerprint: plan.repositoryFingerprint
  });
  const applied = await runCli(target, [
    "apply",
    "--plan",
    planPath,
    "--approval",
    writeApproval,
    "--format",
    "json"
  ]);
  expect(applied.ok).toBe(true);
  const validation = await runCli(target, ["validate", "--format", "json"]);
  expect(validation.ok).toBe(true);
  return { target, artifacts, proposal, plan, planPath, writeApproval, applied, validation };
}

async function allRepositoryPaths(root: string): Promise<string[]> {
  const paths: string[] = [];
  const visit = async (directory: string, relativeDirectory: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (relativeDirectory === "" && entry.name === ".git") continue;
      const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
      paths.push(relativePath);
      if (entry.isDirectory()) await visit(path.join(directory, entry.name), relativePath);
    }
  };
  await visit(root, "");
  return paths.sort();
}

async function assertMinimalFinalState(root: string): Promise<void> {
  const paths = await allRepositoryPaths(root);
  expect(paths).not.toEqual(
    expect.arrayContaining([
      "check",
      ".devcharter/session.json",
      ".devcharter/sessions.json",
      "agents",
      "hooks",
      "mcp",
      "prompts",
      ".github/workflows/ci.yml"
    ])
  );
  for (const repositoryPath of paths) {
    const details = await lstat(path.join(root, ...repositoryPath.split("/")));
    if (!details.isFile()) continue;
    const text = await readFile(path.join(root, ...repositoryPath.split("/")), "utf8");
    expect(text).not.toMatch(/telemetry|publishing token|persisted interview|rollback succeeded/i);
  }
}

interface StableEntry {
  path: string;
  type: string;
  size: number;
  hash?: string;
  symlinkTarget?: string;
}

async function stableSnapshot(root: string): Promise<StableEntry[]> {
  const canonicalRoot = await realpath(root);
  const entries: StableEntry[] = [];
  const visit = async (directory: string, relativeDirectory: string): Promise<void> => {
    const children = (await readdir(directory, { withFileTypes: true })).sort((left, right) =>
      left.name.localeCompare(right.name, "en")
    );
    for (const child of children) {
      if (relativeDirectory === "" && child.name === ".git") continue;
      const repositoryPath = relativeDirectory ? `${relativeDirectory}/${child.name}` : child.name;
      const absolutePath = path.join(directory, child.name);
      const details = await lstat(absolutePath);
      const identity = path.relative(canonicalRoot, absolutePath).split(path.sep).join("/");
      const entry: StableEntry = {
        path: identity,
        type: details.isSymbolicLink()
          ? "symbolic-link"
          : details.isDirectory()
            ? "directory"
            : details.isFile()
              ? "file"
              : "other",
        size: details.size
      };
      if (details.isSymbolicLink()) entry.symlinkTarget = await readlink(absolutePath);
      if (details.isFile()) {
        entry.hash = createHash("sha256")
          .update(await readFile(absolutePath))
          .digest("hex");
      }
      entries.push(entry);
      if (details.isDirectory()) await visit(absolutePath, repositoryPath);
    }
  };
  await visit(canonicalRoot, "");
  return entries;
}

async function gitEvidence(root: string) {
  const [{ stdout: head }, { stdout: status }] = await Promise.all([
    runProgram("git", ["rev-parse", "HEAD"], root),
    runProgram("git", ["status", "--porcelain=v2", "--branch", "--untracked-files=all"], root)
  ]);
  const indexPath = path.join(root, ".git", "index");
  const indexHash = createHash("sha256")
    .update(await readFile(indexPath))
    .digest("hex");
  return { head: head.trim(), indexHash, status: status.replace(/\\/g, "/") };
}

const fullDecisions = [
  { id: "project.outcome", value: "Ship a dependable local tool" },
  { id: "project.technologies", value: ["TypeScript", "Node.js"] },
  { id: "project.aiTools", value: ["Codex"] },
  { id: "project.packageScripts", value: { test: "node --test" } },
  { id: "project.constraints", value: [] },
  { id: "project.risks", value: [] }
];
const aiDecisions = [
  { id: "project.outcome", value: "Ship a focused local tool" },
  { id: "project.aiTools", value: ["Codex"] },
  { id: "project.constraints", value: [] },
  { id: "project.risks", value: [] }
];

describe("SPEC-0001E release journeys through the selected CLI", () => {
  it("1. completes new with full scope", async () => {
    const journey = await completeLifecycle("new", "full", {}, fullDecisions);
    expect(record(journey.applied.result).outcome).toBe("applied");
    expect(await allRepositoryPaths(journey.target)).toEqual(
      expect.arrayContaining(["AGENTS.md", "README.md", "package.json"])
    );
    await assertMinimalFinalState(journey.target);
  });

  it("2. completes new with AI-only minimum output", async () => {
    const journey = await completeLifecycle("new", "ai", {}, aiDecisions);
    expect(await allRepositoryPaths(journey.target)).toEqual(["AGENTS.md"]);
    await assertMinimalFinalState(journey.target);
  });

  it("3. completes retrofit full scope while preserving useful existing content", async () => {
    const files = {
      "README.md": "# Existing service\n\nImportant operator guidance. Run `pnpm test`.\n",
      "AGENTS.md": "# Existing instructions\n\nPreserve domain behavior and run `pnpm test`.\n",
      "package.json": JSON.stringify({ scripts: { test: "vitest run" } }),
      "src/index.ts": "export const domainBehavior = 'preserve-me';\n"
    };
    const journey = await completeLifecycle("retrofit", "full", files, fullDecisions);
    expect(await readFile(path.join(journey.target, "src/index.ts"), "utf8")).toContain(
      "preserve-me"
    );
    expect(await readFile(path.join(journey.target, "README.md"), "utf8")).toContain(
      "Important operator guidance"
    );
    await assertMinimalFinalState(journey.target);
  });

  it("4. detects justified AI overlap and gates consolidation as a conflict", async () => {
    const target = await temporaryDirectory("devcharter-release-overlap-");
    const artifacts = await temporaryDirectory("devcharter-release-overlap-artifacts-");
    const duplicated =
      "# Workflow\nAlways run the repository verification command before completion.\n";
    await writeRepositoryFiles(target, {
      "AGENTS.md": duplicated,
      "prompts/copied.md": duplicated,
      "src/index.ts": "export const established = true;\n"
    });
    const before = await stableSnapshot(target);
    const decisions = await writeJson(artifacts, "decisions.json", aiDecisions);
    const proposed = await runCli(target, [
      "retrofit",
      "--scope",
      "ai",
      "--decisions",
      decisions,
      "--format",
      "json"
    ]);
    expect(proposed.ok).toBe(true);
    const proposal = record(record(proposed.result).proposal);
    expect((proposal.findings as { code: string }[]).map((finding) => finding.code)).toContain(
      "DUPLICATE_AI_MATERIAL"
    );
    expect(
      (proposal.plannedChanges as { action: string }[]).some(
        (change) => change.action === "conflict"
      )
    ).toBe(true);
    expect(await stableSnapshot(target)).toEqual(before);
  });

  it("5. performs a hostile audit with complete stable no-write evidence", async () => {
    const target = await temporaryDirectory("devcharter-release-hostile-");
    await writeRepositoryFiles(target, {
      "README.md": "See [escape](../outside.md) and run `pnpm validate`.\n",
      "package.json": JSON.stringify({ scripts: { validate: "node hostile.js" } }),
      "hostile.js": "require('node:fs').writeFileSync('EXECUTED', 'bad');\n",
      ".env": "SECRET=must-not-be-copied\n"
    });
    await runProgram("git", ["init", "--quiet"], target);
    await runProgram("git", ["config", "user.email", "release@example.invalid"], target);
    await runProgram("git", ["config", "user.name", "Release Fixture"], target);
    await runProgram("git", ["add", "."], target);
    await runProgram("git", ["commit", "--quiet", "-m", "fixture"], target);

    let symlinkCapability: "exercised" | "qualified-skip" = "exercised";
    try {
      await symlink("../outside-target", path.join(target, "unsafe-link"), "file");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EPERM" && code !== "EACCES") throw error;
      symlinkCapability = "qualified-skip";
    }
    const beforeFiles = await stableSnapshot(target);
    const beforeGit = await gitEvidence(target);
    const audit = await runCli(target, ["audit", "--scope", "full", "--format", "json"]);
    expect(audit.ok).toBe(true);
    const afterFiles = await stableSnapshot(target);
    const afterGit = await gitEvidence(target);
    expect(afterFiles).toEqual(beforeFiles);
    expect(afterGit).toEqual(beforeGit);
    expect(await allRepositoryPaths(target)).not.toContain("EXECUTED");
    expect(["exercised", "qualified-skip"]).toContain(symlinkCapability);
    const result = record(audit.result);
    expect(record(result.fingerprintInputs).excludedPaths).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ".env" })])
    );
  });

  it("6. verifies automated specification lifecycle invariants without claiming independent review", async () => {
    const [manifest, specification, skill] = await Promise.all([
      readFile(path.join(repositoryRoot, "MANIFEST.md"), "utf8"),
      readFile(
        path.join(
          repositoryRoot,
          "specs",
          "done",
          "SPEC-0001E-validation-and-release-readiness.md"
        ),
        "utf8"
      ),
      readFile(
        path.join(repositoryRoot, ".agents", "skills", "specification-architect", "SKILL.md"),
        "utf8"
      )
    ]);
    expect(manifest).toContain("specs/done/SPEC-0001E-validation-and-release-readiness.md");
    expect(specification).toContain("| Status | done |");
    expect(specification).toContain("Do not move this specification to `done`");
    expect(specification).toContain("genuinely fresh Codex task independently reviewed candidate");
    expect(skill).toContain("Only explicit human approval permits `draft -> ready`");
    expect(skill).toContain("Implementation begins with `ready -> active`");
    expect(skill).toContain("does not treat author verification as independent evidence");
  });

  it("7. returns an exact no-op for repeated unchanged application", async () => {
    const journey = await completeLifecycle("new", "ai", {}, aiDecisions);
    const before = await stableSnapshot(journey.target);
    const retried = await runCli(journey.target, [
      "apply",
      "--plan",
      journey.planPath,
      "--approval",
      journey.writeApproval,
      "--format",
      "json"
    ]);
    expect(retried).toMatchObject({
      ok: true,
      result: { outcome: "already-applied", changedPaths: [], failures: [] }
    });
    expect(await stableSnapshot(journey.target)).toEqual(before);
    await assertMinimalFinalState(journey.target);
  });

  it("keeps validation free of command execution and the public surface free of prohibited commands", async () => {
    const cliSource = await readFile(
      path.join(repositoryRoot, "packages", "cli", "src", "index.ts"),
      "utf8"
    );
    expect(cliSource).not.toMatch(/execFile|spawn|child_process/);
    expect(cliSource).not.toContain('command === "check"');
    expect(cliSource).not.toContain('command === "session"');
    const target = await temporaryDirectory("devcharter-release-surface-");
    for (const command of ["check", "session"]) {
      const attempted = await runProgram(
        process.execPath,
        [cliPath, command, "--format", "json"],
        target
      );
      expect(attempted.exitCode).toBe(2);
      expect(attempted.stderr).toContain("Unknown command");
    }
  });
});
