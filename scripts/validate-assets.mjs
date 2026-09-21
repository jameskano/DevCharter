import { createHash } from "node:crypto";
import { access, cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const failures = [];
const ignoredDirectories = new Set([".git", "node_modules"]);
const textExtensions = new Set([".js", ".json", ".md", ".mjs", ".txt", ".yaml", ".yml"]);

function relative(value) {
  return path.relative(root, value).split(path.sep).join("/");
}

function fail(message) {
  failures.push(message);
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else if (entry.isFile()) files.push(target);
  }
  return files;
}

async function snapshot(directory) {
  const entries = [];
  for (const file of await walk(directory)) {
    const content = await readFile(file);
    entries.push(`${relativeTo(directory, file)}:${createHash("sha256").update(content).digest("hex")}`);
  }
  return entries.sort().join("\n");
}

function relativeTo(directory, value) {
  return path.relative(directory, value).split(path.sep).join("/");
}

function field(source, name) {
  const match = source.match(new RegExp(`^\\| ${name} \\| ([^|]+)\\|`, "m"));
  return match?.[1].trim();
}

const files = await walk(root);
const markdownFiles = files.filter((file) => path.extname(file).toLowerCase() === ".md");
const textFiles = files.filter((file) => textExtensions.has(path.extname(file).toLowerCase()));
const sources = new Map(
  await Promise.all(textFiles.map(async (file) => [file, await readFile(file, "utf8")]))
);

const packageManifestPath = path.join(root, "package.json");
const packageManifest = JSON.parse(await readFile(packageManifestPath, "utf8"));
const repositoryVersion = packageManifest.version;
if (typeof repositoryVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(repositoryVersion)) {
  fail("package.json: version must be a semantic version");
} else {
  const readme = sources.get(path.join(root, "README.md"));
  if (!readme?.includes(`Current repository version: **${repositoryVersion}**.`)) {
    fail("README.md: current repository version must match package.json");
  }
}

for (const [file, source] of sources) {
  if (source.length > 0 && !source.endsWith("\n")) fail(`${relative(file)}: missing final newline`);
  source.split(/\r?\n/).forEach((line, index) => {
    if (/[ \t]+$/.test(line)) fail(`${relative(file)}:${index + 1}: trailing whitespace`);
  });
}

const generatedSegments = new Set(["dist", ".typecheck", "coverage"]);
for (const file of files) {
  const segments = relative(file).split("/");
  if (segments.some((segment) => generatedSegments.has(segment)) || file.endsWith(".tsbuildinfo")) {
    fail(`${relative(file)}: generated output must not be present`);
  }
}
for (const removed of ["packages/core", "packages/adapter-codex", "packages/cli"]) {
  if (await exists(path.join(root, removed))) fail(`${removed}: removed runtime package still exists`);
}

for (const file of markdownFiles) {
  const source = sources.get(file);
  const targets = [
    ...[...source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]),
    ...[...source.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/gm)].map((match) => match[1])
  ];
  for (const originalTarget of targets) {
    let target = originalTarget.trim().replace(/^<|>$/g, "");
    if (
      target === "" ||
      target.startsWith("#") ||
      /^(?:https?:|mailto:|data:)/i.test(target)
    ) {
      continue;
    }
    target = target.split("#", 1)[0].split("?", 1)[0];
    try {
      target = decodeURIComponent(target);
    } catch {
      fail(`${relative(file)}: invalid encoded link ${originalTarget}`);
      continue;
    }
    const resolved = path.resolve(path.dirname(file), target);
    const escaped = path.relative(root, resolved);
    if (escaped.startsWith("..") || path.isAbsolute(escaped)) {
      fail(`${relative(file)}: link escapes repository: ${originalTarget}`);
    } else if (!(await exists(resolved))) {
      fail(`${relative(file)}: missing link target ${originalTarget}`);
    }
  }
}

const skillFiles = files.filter(
  (file) => relative(file).startsWith(".agents/skills/") && path.basename(file) === "SKILL.md"
);
const skillNames = new Set();
for (const file of skillFiles) {
  const source = sources.get(file);
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontmatter) {
    fail(`${relative(file)}: missing YAML frontmatter`);
    continue;
  }
  const name = frontmatter[1].match(/^name:\s*(\S+)\s*$/m)?.[1];
  const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1];
  if (!name || !description) fail(`${relative(file)}: frontmatter requires name and description`);
  if (name && skillNames.has(name)) fail(`${relative(file)}: duplicate skill name ${name}`);
  if (name) skillNames.add(name);
}
for (const required of ["project-architect", "specification-architect"]) {
  if (!skillNames.has(required)) fail(`missing required skill ${required}`);
}

const claudePluginManifest = path.join(
  root,
  "companions/claude-code/plugin/.claude-plugin/plugin.json"
);
try {
  const manifest = JSON.parse(sources.get(claudePluginManifest) ?? "");
  if (manifest.name !== "devcharter" || typeof manifest.description !== "string" || manifest.description.trim() === "") {
    fail("companions/claude-code/plugin/.claude-plugin/plugin.json: invalid minimal plugin metadata");
  }
} catch (error) {
  fail(`companions/claude-code/plugin/.claude-plugin/plugin.json: invalid JSON: ${error.message}`);
}
const claudeAdapter = path.join(
  root,
  "companions/claude-code/plugin/skills/project-architect/SKILL.md"
);
const claudeAdapterSource = sources.get(claudeAdapter) ?? "";
if (!/^---\r?\n[\s\S]*?^name:\s*project-architect\s*$[\s\S]*?^description:\s*.+$[\s\S]*?^---$/m.test(claudeAdapterSource)) {
  fail("companions/claude-code/plugin/skills/project-architect/SKILL.md: missing valid native skill frontmatter");
}
if (!claudeAdapterSource.includes("../../../../../.agents/skills/project-architect/SKILL.md")) {
  fail("companions/claude-code/plugin/skills/project-architect/SKILL.md: does not route to the canonical Project Architect skill");
}

const specFiles = markdownFiles.filter((file) =>
  /^specs\/(?:approved|draft|ready|active|done|cancelled)\/SPEC-/.test(relative(file))
);
const specIds = new Map();
const specs = [];
for (const file of specFiles) {
  const source = sources.get(file);
  const id = field(source, "ID");
  const status = field(source, "Status");
  const directory = relative(file).split("/")[1];
  if (!id || !status) {
    fail(`${relative(file)}: missing ID or Status metadata`);
    continue;
  }
  if (specIds.has(id)) fail(`${relative(file)}: duplicate specification ID ${id}`);
  specIds.set(id, file);
  specs.push({ file, id, source });
  if (!path.basename(file).startsWith(`${id}-`)) {
    fail(`${relative(file)}: filename does not match specification ID ${id}`);
  }
  if (directory !== "approved" && directory !== status) {
    fail(`${relative(file)}: status ${status} does not match directory ${directory}`);
  }
  if (directory === "approved" && !["ready", "done"].includes(status)) {
    fail(`${relative(file)}: approved parent status must be ready or done`);
  }
}
for (const spec of specs) {
  for (const name of ["Parent", "Dependencies", "Enables", "Supersedes", "Superseded by"]) {
    const value = field(spec.source, name);
    if (!value) continue;
    for (const id of value.match(/SPEC-\d+[A-Z]?/g) ?? []) {
      if (!specIds.has(id)) fail(`${relative(spec.file)}: ${name} references unknown ${id}`);
    }
  }
}
const activeSpecs = specs.filter(({ file }) => relative(file).startsWith("specs/active/"));
if (activeSpecs.length > 1) fail(`expected at most one active specification, found ${activeSpecs.length}`);

const currentSources = [
  "README.md",
  "AGENTS.md",
  "MANIFEST.md",
  "docs/product/purpose-and-scope.md",
  "docs/architecture/system-overview.md",
  "docs/engineering/quality-and-decision-model.md",
  "docs/engineering/spec-driven-workflow.md",
  "docs/user-guide.md",
  "specs/README.md",
  ".agents/skills/project-architect/SKILL.md",
  ".agents/skills/specification-architect/SKILL.md",
  "knowledge/shared-foundation.md",
  "knowledge/ecosystem/component-selection.md",
  "knowledge/technologies/common-stacks.md",
  "knowledge/harnesses/verification-harnesses.md",
  "templates/project-architect-recipes.md",
  "templates/specifications/implementation-spec.md",
  "knowledge/companion-integration-contract.md",
  "companions/codex/README.md",
  "companions/claude-code/README.md",
  "companions/github-copilot/README.md",
  "companions/claude-code/plugin/.claude-plugin/plugin.json",
  "companions/claude-code/plugin/skills/project-architect/SKILL.md",
  ".github/prompts/devcharter.prompt.md",
  "references/official-codex-capabilities.md",
  "references/official-claude-code-capabilities.md",
  "references/official-github-copilot-capabilities.md",
  "tests/scenarios/companion-integration-walkthrough-results.md",
  "tests/scenarios/release-qualification-results.md",
  "docs/release/companion-driven-qualification.md",
  "CONTRIBUTING.md"
];
const obsoleteInstructions = [
  /pnpm\s+exec\s+devcharter/i,
  /\bdevcharter\s+(?:inspect|validate|render|apply|new|retrofit|audit)\b/i,
  /install(?:ing)?\s+(?:the\s+)?(?:local\s+)?tarballs?/i,
  /copy\s+(?:the\s+)?fingerprint/i,
  /create\s+(?:a\s+)?lifecycle\s+json/i
];
for (const name of currentSources) {
  const file = path.join(root, name);
  if (!sources.has(file)) {
    fail(`${name}: required current source is missing`);
  }
}
const currentDocumentation = [...sources.entries()].filter(([file]) => {
  const name = relative(file);
  return (
    currentSources.includes(name) ||
    (name.startsWith("docs/") &&
      !name.startsWith("docs/release/") &&
      name !== "docs/architecture/v0-migration-map.md") ||
    name.startsWith(".agents/") ||
    name.startsWith("companions/") ||
    name.startsWith("knowledge/") ||
    name.startsWith("templates/")
  );
});
for (const [file, source] of currentDocumentation) {
  for (const pattern of obsoleteInstructions) {
    if (pattern.test(source)) {
      fail(`${relative(file)}: contains obsolete operative runtime instruction ${pattern}`);
    }
  }
}

const projectArchitectSource = sources.get(
  path.join(root, ".agents/skills/project-architect/SKILL.md")
) ?? "";
for (const required of [
  "mode: exactly `new`, `retrofit`, or `audit`",
  "scope: exactly `full`, `governance`, `engineering`, or `ai`",
  "DevCharter location",
  "target location",
  "initial context",
  "Proposal approval authorizes only",
  "Only explicit approval of the applicable detailed specification",
  "Reconfirm the sensitive action immediately before execution"
]) {
  if (!projectArchitectSource.includes(required)) {
    fail(`.agents/skills/project-architect/SKILL.md: missing methodology contract: ${required}`);
  }
}
for (const mode of ["new", "retrofit", "audit"]) {
  if (!projectArchitectSource.includes(`\`${mode}\``)) {
    fail(`.agents/skills/project-architect/SKILL.md: missing mode ${mode}`);
  }
}
for (const scope of ["full", "governance", "engineering", "ai"]) {
  if (!projectArchitectSource.includes(`\`${scope}\``)) {
    fail(`.agents/skills/project-architect/SKILL.md: missing scope ${scope}`);
  }
}

const methodologyFixturePath = path.join(
  root,
  "tests/fixtures/project-architect-scenarios.json"
);
let methodologyScenarioCount = 0;
try {
  const fixture = JSON.parse(await readFile(methodologyFixturePath, "utf8"));
  if (
    typeof fixture.devcharterLocation !== "string" ||
    typeof fixture.targetLocation !== "string" ||
    fixture.devcharterLocation === fixture.targetLocation
  ) {
    fail("tests/fixtures/project-architect-scenarios.json: source and target locations must differ");
  }
  const scenarios = fixture.scenarios;
  if (!Array.isArray(scenarios)) throw new Error("scenarios must be an array");
  methodologyScenarioCount = scenarios.length;
  const requiredScenarioIds = [
    "new-full-custom-config",
    "retrofit-tool-gap",
    "audit-hostile-target",
    "single-spec-lifecycle",
    "multi-spec-lifecycle",
    "missing-permission",
    "dangerous-action",
    "unsupported-technology",
    "overengineering-rejection",
    "recovery-and-stale-state"
  ];
  const scenarioIds = new Set();
  for (const scenario of scenarios) {
    if (typeof scenario.id !== "string" || scenario.id.trim() === "") {
      fail("tests/fixtures/project-architect-scenarios.json: scenario missing id");
      continue;
    }
    if (scenarioIds.has(scenario.id)) {
      fail(`tests/fixtures/project-architect-scenarios.json: duplicate scenario ${scenario.id}`);
    }
    scenarioIds.add(scenario.id);
    if (!["new", "retrofit", "audit"].includes(scenario.mode)) {
      fail(`tests/fixtures/project-architect-scenarios.json: ${scenario.id} has invalid mode`);
    }
    if (!["full", "governance", "engineering", "ai"].includes(scenario.scope)) {
      fail(`tests/fixtures/project-architect-scenarios.json: ${scenario.id} has invalid scope`);
    }
    if (typeof scenario.initialContext !== "string" || scenario.initialContext.trim() === "") {
      fail(`tests/fixtures/project-architect-scenarios.json: ${scenario.id} lacks initial context`);
    }
    for (const list of ["startingEvidence", "expected", "prohibited"]) {
      if (!Array.isArray(scenario[list]) || scenario[list].length === 0) {
        fail(`tests/fixtures/project-architect-scenarios.json: ${scenario.id} lacks ${list}`);
      }
    }
  }
  for (const id of requiredScenarioIds) {
    if (!scenarioIds.has(id)) {
      fail(`tests/fixtures/project-architect-scenarios.json: missing required scenario ${id}`);
    }
  }
  const audit = scenarios.find(({ id }) => id === "audit-hostile-target");
  const auditProhibited = audit?.prohibited?.join(" ") ?? "";
  for (const boundary of ["Script execution", "Dependency installation", "mutation", "state"]) {
    if (!auditProhibited.includes(boundary)) {
      fail(`tests/fixtures/project-architect-scenarios.json: audit omits ${boundary} boundary`);
    }
  }
} catch (error) {
  fail(`tests/fixtures/project-architect-scenarios.json: invalid fixture: ${error.message}`);
}

const releaseFixturePath = path.join(root, "tests/fixtures/release-qualification-scenarios.json");
const requiredReleaseScenarioIds = [
  "new-full-browser-open",
  "new-ai-focused",
  "retrofit-full-approved-tools",
  "retrofit-ai-focused",
  "audit-hostile-no-write",
  "single-spec-two-gates",
  "multi-spec-deviation-return",
  "capability-failures",
  "sensitive-confirmations",
  "source-target-isolation"
];
let releaseScenarioCount = 0;
try {
  const fixture = JSON.parse(await readFile(releaseFixturePath, "utf8"));
  if (
    typeof fixture.devcharterLocation !== "string" ||
    typeof fixture.targetLocation !== "string" ||
    fixture.devcharterLocation === fixture.targetLocation
  ) {
    fail("tests/fixtures/release-qualification-scenarios.json: source and target must differ");
  }
  const scenarios = fixture.scenarios;
  if (!Array.isArray(scenarios)) throw new Error("scenarios must be an array");
  releaseScenarioCount = scenarios.length;
  const ids = new Set();
  for (const scenario of scenarios) {
    if (typeof scenario.id !== "string" || scenario.id.trim() === "") {
      fail("tests/fixtures/release-qualification-scenarios.json: scenario missing id");
      continue;
    }
    if (ids.has(scenario.id)) {
      fail(`tests/fixtures/release-qualification-scenarios.json: duplicate ${scenario.id}`);
    }
    ids.add(scenario.id);
    if (!["new", "retrofit", "audit"].includes(scenario.mode)) {
      fail(`tests/fixtures/release-qualification-scenarios.json: ${scenario.id} has invalid mode`);
    }
    if (!["full", "governance", "engineering", "ai"].includes(scenario.scope)) {
      fail(`tests/fixtures/release-qualification-scenarios.json: ${scenario.id} has invalid scope`);
    }
    if (typeof scenario.initialContext !== "string" || scenario.initialContext.trim() === "") {
      fail(`tests/fixtures/release-qualification-scenarios.json: ${scenario.id} lacks initial context`);
    }
    for (const list of [
      "startingState",
      "approvalSequence",
      "expectedEffects",
      "preservedPaths",
      "prohibitedEffects"
    ]) {
      if (!Array.isArray(scenario[list])) {
        fail(`tests/fixtures/release-qualification-scenarios.json: ${scenario.id} lacks ${list}`);
      }
    }
  }
  for (const id of requiredReleaseScenarioIds) {
    if (!ids.has(id)) {
      fail(`tests/fixtures/release-qualification-scenarios.json: missing required scenario ${id}`);
    }
  }
  const audit = scenarios.find(({ id }) => id === "audit-hostile-no-write");
  const auditBoundaries = audit?.prohibitedEffects?.join(" ") ?? "";
  for (const boundary of [
    "Target file write",
    "Lockfile write",
    "Cache write",
    "Git metadata write",
    "Report file",
    "External mutation",
    "Target script execution"
  ]) {
    if (!auditBoundaries.includes(boundary)) {
      fail(`tests/fixtures/release-qualification-scenarios.json: audit omits ${boundary}`);
    }
  }
  const sensitive = scenarios.find(({ id }) => id === "sensitive-confirmations");
  const sensitiveBoundaries = sensitive?.prohibitedEffects?.join(" ") ?? "";
  for (const boundary of ["Secret access", "External data sharing", "Remote write", "Destructive action", "Hard-to-reverse action"]) {
    if (!sensitiveBoundaries.includes(boundary)) {
      fail(`tests/fixtures/release-qualification-scenarios.json: sensitive scenario omits ${boundary}`);
    }
  }
} catch (error) {
  fail(`tests/fixtures/release-qualification-scenarios.json: invalid fixture: ${error.message}`);
}

const releaseResultsPath = path.join(root, "tests/scenarios/release-qualification-results.md");
const releaseResults = sources.get(releaseResultsPath) ?? "";
for (const id of requiredReleaseScenarioIds) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const section = releaseResults.match(
    new RegExp("^## `" + escapedId + "`\\r?\\n([\\s\\S]*?)(?=^## `|^## Evaluation notes)", "m")
  )?.[1] ?? "";
  if (section === "") {
    fail(`tests/scenarios/release-qualification-results.md: missing evidence section ${id}`);
    continue;
  }
  for (const label of [
    "Evidence type:",
    "Questions:",
    "Proposal and approval:",
    "SDD and implementation gate:",
    "Changed and preserved paths:",
    "Procedure and actual result:",
    "Limitations:"
  ]) {
    if (!section.includes(label)) {
      fail(`tests/scenarios/release-qualification-results.md: ${id} lacks ${label}`);
    }
  }
}

{
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "devcharter-hostile-audit-"));
  const stagedSource = path.join(temporaryRoot, "devcharter-source");
  const hostileTarget = path.join(temporaryRoot, "target");
  const boundedExternalState = path.join(temporaryRoot, "external-state");
  try {
    await mkdir(stagedSource);
    await mkdir(hostileTarget);
    await mkdir(boundedExternalState);
    await mkdir(path.join(hostileTarget, ".git"));
    await mkdir(path.join(hostileTarget, ".cache"));
    await writeFile(path.join(stagedSource, "source-sentinel.txt"), "read-only source\n", "utf8");
    await writeFile(
      path.join(hostileTarget, "package.json"),
      `${JSON.stringify({ scripts: { postinstall: "node -e \"require('node:fs').writeFileSync('side-effect.txt','ran')\"" } }, null, 2)}\n`,
      "utf8"
    );
    await writeFile(path.join(hostileTarget, "package-lock.json"), "{}\n", "utf8");
    await writeFile(path.join(hostileTarget, ".cache", "sentinel.txt"), "unchanged cache\n", "utf8");
    await writeFile(path.join(hostileTarget, ".git", "HEAD"), "ref: refs/heads/main\n", "utf8");
    await writeFile(path.join(hostileTarget, ".git", "index"), "fixture index\n", "utf8");
    await writeFile(path.join(hostileTarget, ".env"), "TOKEN=fixture-value\n", "utf8");
    await writeFile(path.join(hostileTarget, "generated.bin"), Buffer.from([0, 1, 2, 3]));
    await writeFile(
      path.join(boundedExternalState, "sentinel.txt"),
      "unchanged external state\n",
      "utf8"
    );
    const sourceBefore = await snapshot(stagedSource);
    const targetBefore = await snapshot(hostileTarget);
    const externalBefore = await snapshot(boundedExternalState);
    const names = await readdir(hostileTarget);
    const manifest = JSON.parse(await readFile(path.join(hostileTarget, "package.json"), "utf8"));
    if (!names.includes(".env") || typeof manifest.scripts?.postinstall !== "string") {
      fail("hostile audit walkthrough: fixture evidence was not observable");
    }
    const sourceAfter = await snapshot(stagedSource);
    const targetAfter = await snapshot(hostileTarget);
    const externalAfter = await snapshot(boundedExternalState);
    if (sourceBefore !== sourceAfter) fail("hostile audit walkthrough: source changed during review");
    if (targetBefore !== targetAfter) fail("hostile audit walkthrough: target changed during read-only review");
    if (externalBefore !== externalAfter) fail("hostile audit walkthrough: external state changed");
    if (await exists(path.join(hostileTarget, "side-effect.txt"))) {
      fail("hostile audit walkthrough: untrusted script executed");
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

const qualificationRecord = sources.get(
  path.join(root, "docs/release/companion-driven-qualification.md")
) ?? "";
const qualificationRows = new Map();
for (const match of qualificationRecord.matchAll(
  /^\| (SPEC-0002[A-D]?-AC-\d{2}) \| (pass|pending|blocked) \| ([^|\r\n]+)\|$/gm
)) {
  if (qualificationRows.has(match[1])) {
    fail(`docs/release/companion-driven-qualification.md: duplicate criterion ${match[1]}`);
  }
  qualificationRows.set(match[1], { state: match[2], evidence: match[3].trim() });
}
for (const [id, count] of [
  ["SPEC-0002", 27],
  ["SPEC-0002A", 12],
  ["SPEC-0002B", 18],
  ["SPEC-0002C", 15],
  ["SPEC-0002D", 18]
]) {
  for (let number = 1; number <= count; number += 1) {
    const criterion = `${id}-AC-${String(number).padStart(2, "0")}`;
    const row = qualificationRows.get(criterion);
    if (!row) {
      fail(`docs/release/companion-driven-qualification.md: missing criterion ${criterion}`);
    } else if (row.evidence.length < 20) {
      fail(`docs/release/companion-driven-qualification.md: criterion ${criterion} lacks evidence`);
    }
  }
}
if (qualificationRows.size !== 90) {
  fail(`docs/release/companion-driven-qualification.md: expected 90 unique criterion rows, found ${qualificationRows.size}`);
}
for (const companion of ["Codex", "Claude Code", "GitHub Copilot"]) {
  if (!qualificationRecord.includes(`### ${companion}`)) {
    fail(`docs/release/companion-driven-qualification.md: missing ${companion} host evidence`);
  }
}

const capabilityRecords = {
  codex: "references/official-codex-capabilities.md",
  "claude-code": "references/official-claude-code-capabilities.md",
  "github-copilot": "references/official-github-copilot-capabilities.md"
};
const integrationContract = sources.get(
  path.join(root, "knowledge/companion-integration-contract.md")
) ?? "";
for (const companion of ["codex", "claude-code", "github-copilot"]) {
  const name = `companions/${companion}/README.md`;
  const source = sources.get(path.join(root, name)) ?? "";
  if (!source.includes("../../.agents/skills/project-architect/SKILL.md")) {
    fail(`${name}: does not route to the Project Architect skill`);
  }
  if (!source.includes("../../knowledge/companion-integration-contract.md")) {
    fail(`${name}: does not route to the shared integration contract`);
  }
  if (!source.includes(`../../${capabilityRecords[companion]}`)) {
    fail(`${name}: does not route to its dated capability record`);
  }
  const capabilitySource = sources.get(path.join(root, capabilityRecords[companion])) ?? "";
  if (!capabilitySource.includes("2026-09-19") || !capabilitySource.includes("## Official sources")) {
    fail(`${capabilityRecords[companion]}: missing dated official capability evidence`);
  }
  const normalized = source.toLowerCase().replace(/\s+/g, " ");
  for (const required of [
    "mode:",
    "scope:",
    "devcharter location:",
    "target location:",
    "initial context:",
    "proposal approval",
    "specification approval",
    "read-only",
    "strong reasoning"
  ]) {
    if (!normalized.includes(required)) fail(`${name}: missing integration contract text: ${required}`);
  }
  if (!integrationContract.includes(`| ${companion === "claude-code" ? "Claude Code" : companion === "github-copilot" ? "GitHub Copilot" : "Codex"} |`)) {
    fail(`knowledge/companion-integration-contract.md: missing ${companion} conformance row`);
  }
}

const companionFixturePath = path.join(root, "tests/fixtures/companion-integration-scenarios.json");
let companionScenarioCount = 0;
try {
  const fixture = JSON.parse(await readFile(companionFixturePath, "utf8"));
  const validateScenarioEvidence = (scenario, kind, fieldName) => {
    const assertions = scenario[fieldName];
    if (!Array.isArray(assertions) || assertions.length === 0) {
      fail(`tests/fixtures/companion-integration-scenarios.json: ${kind} ${scenario.id} lacks ${fieldName} assertions`);
      return;
    }
    for (const assertion of assertions) {
      if (typeof assertion.path !== "string" || typeof assertion.contains !== "string") {
        fail(`tests/fixtures/companion-integration-scenarios.json: ${scenario.id} has invalid evidence assertion`);
        continue;
      }
      const source = sources.get(path.join(root, assertion.path));
      if (source === undefined) {
        fail(`tests/fixtures/companion-integration-scenarios.json: ${scenario.id} evidence path is missing: ${assertion.path}`);
      } else if (!source.includes(assertion.contains)) {
        fail(`tests/fixtures/companion-integration-scenarios.json: ${scenario.id} evidence text is missing from ${assertion.path}: ${assertion.contains}`);
      }
    }
  };
  if (!Array.isArray(fixture.companions) || fixture.companions.length !== 3) {
    fail("tests/fixtures/companion-integration-scenarios.json: expected three companions");
  } else {
    const companionIds = new Set();
    for (const companion of fixture.companions) {
      companionIds.add(companion.id);
      for (const key of ["entrypoint", "capabilityRecord"]) {
        if (typeof companion[key] !== "string" || !(await exists(path.join(root, companion[key])))) {
          fail(`tests/fixtures/companion-integration-scenarios.json: ${companion.id} has invalid ${key}`);
        }
      }
      if (!Array.isArray(companion.nativeAssets) || companion.nativeAssets.length === 0) {
        fail(`tests/fixtures/companion-integration-scenarios.json: ${companion.id} lacks native assets`);
      } else {
        for (const asset of companion.nativeAssets) {
          if (!(await exists(path.join(root, asset)))) {
            fail(`tests/fixtures/companion-integration-scenarios.json: missing native asset ${asset}`);
          }
        }
      }
    }
    for (const required of ["codex", "claude-code", "github-copilot"]) {
      if (!companionIds.has(required)) {
        fail(`tests/fixtures/companion-integration-scenarios.json: missing companion ${required}`);
      }
    }
  }
  const expectedNegativeIds = new Set([
    "missing-input",
    "inaccessible-source",
    "unwritable-target",
    "unavailable-tool",
    "sensitive-action",
    "source-write"
  ]);
  if (!Array.isArray(fixture.negativeScenarios)) throw new Error("negativeScenarios must be an array");
  if (fixture.negativeScenarios.length !== expectedNegativeIds.size) {
    fail("tests/fixtures/companion-integration-scenarios.json: expected exactly six negative scenarios");
  }
  if (!Array.isArray(fixture.representativeJourneys) || fixture.representativeJourneys.length !== 3) {
    fail("tests/fixtures/companion-integration-scenarios.json: expected three representative journeys");
  } else {
    const journeyCompanions = new Set();
    for (const journey of fixture.representativeJourneys) {
      journeyCompanions.add(journey.companion);
      for (const key of ["id", "startingState", "expected", "prohibited"]) {
        if (typeof journey[key] !== "string" || journey[key].trim() === "") {
          fail(`tests/fixtures/companion-integration-scenarios.json: representative journey lacks ${key}`);
        }
      }
      validateScenarioEvidence(journey, "representative journey", "evidence");
      validateScenarioEvidence(journey, "representative journey", "resultEvidence");
    }
    for (const required of ["codex", "claude-code", "github-copilot"]) {
      if (!journeyCompanions.has(required)) {
        fail(`tests/fixtures/companion-integration-scenarios.json: missing ${required} journey`);
      }
    }
  }
  companionScenarioCount = fixture.negativeScenarios.length;
  const seenNegativeIds = new Set();
  for (const scenario of fixture.negativeScenarios) {
    if (!expectedNegativeIds.has(scenario.id) || seenNegativeIds.has(scenario.id)) {
      fail(`tests/fixtures/companion-integration-scenarios.json: unexpected or duplicate negative scenario ${scenario.id}`);
    }
    seenNegativeIds.add(scenario.id);
    expectedNegativeIds.delete(scenario.id);
    if (typeof scenario.startingState !== "string" || typeof scenario.expected !== "string") {
      fail(`tests/fixtures/companion-integration-scenarios.json: ${scenario.id} is incomplete`);
    }
    validateScenarioEvidence(scenario, "negative scenario", "evidence");
    validateScenarioEvidence(scenario, "negative scenario", "resultEvidence");
  }
  for (const id of expectedNegativeIds) {
    fail(`tests/fixtures/companion-integration-scenarios.json: missing negative scenario ${id}`);
  }
  for (const token of fixture.requiredContract ?? []) {
    if (!integrationContract.toLowerCase().includes(String(token).toLowerCase())) {
      fail(`knowledge/companion-integration-contract.md: missing fixture contract token ${token}`);
    }
  }
} catch (error) {
  fail(`tests/fixtures/companion-integration-scenarios.json: invalid fixture: ${error.message}`);
}

const fixturePath = path.join(root, "tests/fixtures/separate-locations.json");
let separateLocationFixture;
try {
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  separateLocationFixture = fixture;
  for (const key of [
    "mode",
    "scope",
    "devcharterLocation",
    "targetLocation",
    "initialContext",
    "expectedNextInstruction"
  ]) {
    if (typeof fixture[key] !== "string" || fixture[key].trim() === "") {
      fail(`tests/fixtures/separate-locations.json: missing ${key}`);
    }
  }
  if (fixture.devcharterLocation === fixture.targetLocation) {
    fail("tests/fixtures/separate-locations.json: source and target must differ");
  }
  if (!(await exists(path.join(root, fixture.expectedNextInstruction ?? "")))) {
    fail("tests/fixtures/separate-locations.json: next instruction does not resolve");
  }
} catch (error) {
  fail(`tests/fixtures/separate-locations.json: invalid JSON: ${error.message}`);
}

if (separateLocationFixture) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "devcharter-separate-locations-"));
  const stagedSource = path.join(temporaryRoot, "devcharter-source");
  const stagedTarget = path.join(temporaryRoot, "target-project");
  try {
    await cp(root, stagedSource, {
      recursive: true,
      filter(source) {
        const segments = relativeTo(root, source).split("/");
        return !segments.some((segment) => ignoredDirectories.has(segment));
      }
    });
    await mkdir(stagedTarget);
    await writeFile(path.join(stagedTarget, "project.txt"), "target sentinel\n", "utf8");
    const before = await snapshot(stagedTarget);
    const invocation = {
      ...separateLocationFixture,
      devcharterLocation: stagedSource,
      targetLocation: stagedTarget
    };
    if (invocation.devcharterLocation === invocation.targetLocation) {
      fail("separate-location walkthrough: staged source and target are not distinct");
    }
    const stagedReadme = await readFile(path.join(stagedSource, "README.md"), "utf8");
    for (const label of ["Mode:", "Scope:", "DevCharter location:", "Target location:", "Initial context:"]) {
      if (!stagedReadme.includes(label)) {
        fail(`separate-location walkthrough: root entrypoint is missing ${label}`);
      }
    }
    const stagedRoutes = [
      ["Codex", "companions/codex/README.md", "../../.agents/skills/project-architect/SKILL.md"],
      ["Claude Code", "companions/claude-code/README.md", "../../.agents/skills/project-architect/SKILL.md"],
      ["GitHub Copilot", "companions/github-copilot/README.md", "../../.agents/skills/project-architect/SKILL.md"],
      ["Claude adapter", "companions/claude-code/plugin/skills/project-architect/SKILL.md", "../../../../../.agents/skills/project-architect/SKILL.md"],
      ["Copilot prompt", ".github/prompts/devcharter.prompt.md", "../../.agents/skills/project-architect/SKILL.md"]
    ];
    for (const [label, asset, route] of stagedRoutes) {
      const assetPath = path.join(stagedSource, asset);
      const assetSource = await readFile(assetPath, "utf8");
      if (!assetSource.includes(route)) {
        fail(`separate-location walkthrough: ${label} does not name the shared skill`);
      } else if (!(await exists(path.resolve(path.dirname(assetPath), route)))) {
        fail(`separate-location walkthrough: ${label} skill route does not resolve in staged source`);
      }
    }
    const after = await snapshot(stagedTarget);
    if (before !== after) fail("separate-location walkthrough: target changed during routing");
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

for (const forbidden of ["bin", "dependencies", "devDependencies", "exports", "workspaces"]) {
  if (forbidden in packageManifest) fail(`package.json: contributor manifest must not define ${forbidden}`);
}
if (packageManifest.private !== true) fail("package.json: contributor manifest must remain private");

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk-proj-[A-Za-z0-9_-]{20,}\b/
];
for (const [file, source] of sources) {
  for (const pattern of secretPatterns) {
    if (pattern.test(source)) fail(`${relative(file)}: possible secret signature`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`Static asset verification failed (${failures.length}):\n`);
  for (const failure of failures.sort()) process.stderr.write(`- ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Static asset verification passed on ${process.version}: ${markdownFiles.length} Markdown files, ${specs.length} specifications, ${skillFiles.length} canonical skills, ${methodologyScenarioCount} methodology scenarios, ${companionScenarioCount} companion failure scenarios, ${releaseScenarioCount} release scenarios with evidence assertions, separate-location and hostile-audit walkthroughs.\n`
  );
}
