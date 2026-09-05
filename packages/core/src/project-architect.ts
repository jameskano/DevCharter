import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";

import {
  type AcceptedDecision,
  acceptedDecisionSchema,
  type ArtifactRecord,
  type ConsideredComponent,
  type Confidence,
  type CriticalJourney,
  ecosystemProposalSchema,
  type EcosystemProposal,
  type EstablishmentSignal,
  type Evidence,
  type FingerprintExclusion,
  type FingerprintGitFact,
  type FingerprintPathInput,
  type Finding,
  type JsonValue,
  type Mode,
  modeSchema,
  type PlannedFileChange,
  type ProposalAssumption,
  type ProposalMode,
  type ProjectFact,
  type ProjectQuestion,
  proposalApprovalSchema,
  type ProposalApproval,
  type RepositoryFingerprintInputs,
  type Scope,
  scopeSchema
} from "./model.js";
import { RepositoryReader } from "./repository.js";
import { DevCharterError, failure, success, type Result } from "./results.js";
import { compareCanonicalText, stableHash } from "./serialization.js";
import { computeScopedRepositoryFingerprint } from "./project-architect/fingerprint.js";
import { classifySkillProvenance } from "./project-architect/skill-provenance.js";
import {
  analyzeRuntimeAiEvidence,
  bindRuntimeAiFingerprintEvidence,
  type RuntimeAiEvidence
} from "./project-architect/runtime-ai.js";

const SEMANTIC_LIMIT = 1024 * 1024;
const FINGERPRINT_LIMIT = 4 * 1024 * 1024;
const BINARY_PREFIX_LIMIT = 8192;

const BINARY_EXTENSIONS = new Set([
  ".7z",
  ".avi",
  ".bin",
  ".bmp",
  ".class",
  ".dll",
  ".doc",
  ".docx",
  ".eot",
  ".exe",
  ".gif",
  ".gz",
  ".ico",
  ".jar",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp3",
  ".mp4",
  ".otf",
  ".pdf",
  ".png",
  ".so",
  ".tar",
  ".ttf",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
  ".xls",
  ".xlsx",
  ".zip"
]);

const SECRET_BASENAMES = new Set([
  ".npmrc",
  ".pypirc",
  ".netrc",
  "credentials",
  "credentials.json",
  "id_rsa",
  "id_ed25519"
]);

const MODE_CLASSIFICATION_NAMES = new Set([
  "package.json",
  "deno.json",
  "pyproject.toml",
  "cargo.toml",
  "go.mod",
  "pom.xml",
  "dockerfile",
  "compose.yaml",
  "compose.yml"
]);

const PACKAGE_MANAGER_BUILTINS = new Set([
  "add",
  "approve-builds",
  "audit",
  "bin",
  "config",
  "create",
  "deploy",
  "dlx",
  "env",
  "exec",
  "fetch",
  "help",
  "import",
  "init",
  "install",
  "licenses",
  "link",
  "list",
  "outdated",
  "pack",
  "patch",
  "patch-commit",
  "prune",
  "publish",
  "rebuild",
  "remove",
  "root",
  "run",
  "self-update",
  "server",
  "setup",
  "store",
  "unlink",
  "unpublish",
  "update",
  "why"
]);
const VERIFICATION_COMMAND_NAMES = new Set([
  "build",
  "check",
  "clippy",
  "lint",
  "mypy",
  "pytest",
  "ruff",
  "test",
  "typecheck",
  "verify",
  "vet"
]);
const CONFLICT_FINDING_CODES = new Set([
  "COMMAND_AUTHORITY_AMBIGUOUS",
  "DUPLICATE_AI_MATERIAL",
  "DUPLICATE_SPEC_ID",
  "INSTRUCTION_ROUTING_CONFLICT",
  "SPEC_PRECEDENCE_CONFLICT",
  "SPEC_STATUS_PATH_CONFLICT",
  "UNKNOWN_GENERATED_OWNERSHIP"
]);
const DECISION_IDS = new Set([
  "project.outcome",
  "project.technologies",
  "project.aiTools",
  "project.constraints",
  "project.risks",
  "project.mode",
  "project.manifestPath"
]);

type CommandAuthorityKind = "package-json" | "python" | "cargo" | "go" | "maven";

interface CommandAuthority {
  path: string;
  directory: string;
  kind: CommandAuthorityKind;
  name?: string;
  scripts: Set<string>;
  standardCommands: Set<string>;
}

interface DetectedContext {
  technologies: string[];
  aiTools: string[];
  manifests: CommandAuthority[];
  inferredOutcome?: { value: string; evidence: Evidence[] };
  constraintEvidence: Evidence[];
  riskEvidence: Evidence[];
}

export interface ProjectArchitectRequest {
  mode: Mode;
  scope?: Scope;
  acceptedDecisions?: AcceptedDecision[];
  previousProposal?: EcosystemProposal;
}

export interface ModeRecommendation {
  recommendedMode: "new" | "retrofit";
  confidence: Confidence;
  signals: EstablishmentSignal[];
  uncertainty?: string;
}

export interface ProjectArchitectResult {
  mode: Mode;
  scope: Scope;
  summary: string;
  recommendation: ModeRecommendation;
  artifacts: ArtifactRecord[];
  semanticallyInspectedPaths: string[];
  fingerprintInputs: RepositoryFingerprintInputs;
  repositoryFingerprint: string;
  facts: ProjectFact[];
  findings: Finding[];
  assumptions: ProposalAssumption[];
  questions: ProjectQuestion[];
  criticalJourneys: CriticalJourney[];
  consideredComponents: ConsideredComponent[];
  plannedChanges: PlannedFileChange[];
  preservedPaths: string[];
  conflicts: Finding[];
  risks: string[];
  proposal?: EcosystemProposal;
  appliedChanges: [];
  validation: string[];
  deferredWork: string[];
}

export type GitRunner = (root: string, arguments_: readonly string[]) => Promise<string>;

export interface ProjectArchitectOptions {
  gitRunner?: GitRunner;
}

interface FingerprintBuild {
  artifacts: ArtifactRecord[];
  inputs: RepositoryFingerprintInputs;
  repositoryFingerprint: string;
  texts: Map<string, string>;
  semanticallyInspectedPaths: string[];
  skillProvenanceUncertainties: Evidence[];
  runtimeAiEvidence: RuntimeAiEvidence;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function scopeIncludes(scope: Scope, candidate: Exclude<Scope, "full">): boolean {
  return scope === "full" || scope === candidate;
}

function stripReferenceSuffix(value: string): string {
  const trimmed = value.trim();
  const target = trimmed.startsWith("<")
    ? (trimmed.match(/^<([^>]+)>/)?.[1] ?? trimmed)
    : (trimmed.split(/\s+/, 1)[0] ?? trimmed);
  return target.split(/[?#]/, 1)[0] ?? target;
}

function looksLikeRepositoryPath(value: string): boolean {
  const normalized = value.trim().replace(/^['"(<]+|['")>,.;:]+$/g, "");
  return (
    /^(?:\.\/|\.\.\/)?(?:docs|specs|src|app|apps|packages|tests?|prompts|\.agents|\.codex)\/[A-Za-z0-9._/@+-]+(?:\/[A-Za-z0-9._/@+-]+)*$/i.test(
      normalized
    ) ||
    /^(?:\.\/|\.\.\/)?[A-Za-z0-9._@+-]+(?:\/[A-Za-z0-9._@+-]+)*\/[A-Za-z0-9_@+-]+\.[A-Za-z0-9._+-]+$/i.test(
      normalized
    ) ||
    /^(?:AGENTS(?:\.override)?\.md|README(?:\.[A-Za-z0-9_-]+)?\.md|MANIFEST\.md|package\.json|pyproject\.toml|Cargo\.toml|go\.mod)$/i.test(
      normalized
    )
  );
}

function markdownOutsideFencedCode(text: string): string {
  const visibleLines: string[] = [];
  let fenceCharacter: "`" | "~" | undefined;
  let fenceLength = 0;
  for (const line of text.split(/\r?\n/)) {
    const opening = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceCharacter === undefined) {
      if (opening !== null) {
        fenceCharacter = opening[1]?.[0] as "`" | "~";
        fenceLength = opening[1]?.length ?? 3;
      } else {
        visibleLines.push(line);
      }
      continue;
    }
    const closing = line.match(/^\s*(`{3,}|~{3,})\s*$/)?.[1];
    if (closing !== undefined && closing[0] === fenceCharacter && closing.length >= fenceLength) {
      fenceCharacter = undefined;
      fenceLength = 0;
    }
  }
  return visibleLines.join("\n");
}

function inlinePathHasReferenceIntent(text: string, index: number, length: number): boolean {
  const lineStart = text.lastIndexOf("\n", index) + 1;
  const nextLine = text.indexOf("\n", index + length);
  const lineEnd = nextLine === -1 ? text.length : nextLine;
  const line = text.slice(lineStart, lineEnd);
  const beforeTarget = text.slice(lineStart, index);
  return (
    /^\s*(?:[-*]\s*)?(?:read|see|follow|consult|open|review|update|edit)\b/i.test(line) ||
    /\b(?:read|see|follow|consult|open|review|update|edit)(?:\s+the)?\s*$/i.test(beforeTarget) ||
    /\b(?:defined|documented|located|stored|available)\s+(?:in|at)\s*$/i.test(beforeTarget)
  );
}

function extractReferencedTargets(
  sourcePath: string,
  text: string,
  options: { includeImplicitInline?: boolean } = {}
): string[] {
  const targets = new Set<string>();
  const markdown = /\.(md|mdx)$/i.test(sourcePath);
  if (markdown) {
    const referenceText = markdownOutsideFencedCode(text);
    for (const match of referenceText.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      if (match[1] !== undefined) targets.add(match[1].trim());
    }
    for (const match of referenceText.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/gm)) {
      if (match[1] !== undefined) targets.add(match[1].trim());
    }
    for (const match of referenceText.matchAll(/(?<!`)`([^`\r\n]+)`(?!`)/g)) {
      const candidate = match[1]?.trim();
      if (
        candidate !== undefined &&
        looksLikeRepositoryPath(candidate) &&
        (options.includeImplicitInline === true ||
          inlinePathHasReferenceIntent(referenceText, match.index, match[0].length))
      ) {
        targets.add(candidate);
      }
    }
  }
  if (/(^|\/)AGENTS(?:\.override)?\.md$/i.test(sourcePath)) {
    for (const match of text.matchAll(
      /(?:^|[\s`(])((?:\.\.?\/)?(?:docs|specs|src|app|apps|packages|tests?|prompts|\.agents|\.codex)\/[A-Za-z0-9._/@+-]+(?:\/[A-Za-z0-9._/@+-]+)*)/gim
    )) {
      if (match[1] !== undefined && looksLikeRepositoryPath(match[1])) targets.add(match[1]);
    }
  }
  return [...targets].sort(compareCanonicalText);
}

function resolveReferencedPath(sourcePath: string, target: string): string | undefined {
  if (/^(https?:|mailto:|#|\/)/i.test(target) || target.includes("{")) return undefined;
  const withoutSuffix = stripReferenceSuffix(target);
  if (!withoutSuffix || path.posix.isAbsolute(withoutSuffix)) return undefined;
  const resolved = normalizePath(
    path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), withoutSuffix))
  );
  if (resolved === ".." || resolved.startsWith("../")) return undefined;
  return resolved;
}

function manifestDirectory(repositoryPath: string): string {
  const directory = path.posix.dirname(repositoryPath);
  return directory === "." ? "" : directory;
}

function readStaticPythonScripts(text: string): Set<string> {
  const scripts = new Set<string>();
  let inScripts = false;
  for (const line of text.split(/\r?\n/)) {
    const section = line.match(/^\s*\[([^\]]+)]\s*(?:#.*)?$/)?.[1]?.toLowerCase();
    if (section !== undefined) {
      inScripts = section === "project.scripts" || section === "tool.poetry.scripts";
      continue;
    }
    if (!inScripts || /^\s*(?:#|$)/.test(line)) continue;
    const key = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=/)?.[1];
    if (key !== undefined) scripts.add(key);
  }
  return scripts;
}

function readDeclaredPythonTools(text: string): Set<string> {
  const tools = new Set<string>();
  for (const match of text.matchAll(/^\s*\[([^\]]+)]\s*(?:#.*)?$/gm)) {
    const section = match[1]?.toLowerCase();
    for (const tool of ["pytest", "ruff", "mypy"] as const) {
      if (section?.startsWith(`tool.${tool}`)) tools.add(tool);
    }
  }
  for (const match of text.matchAll(
    /(?:^|\n)\s*(?:dependencies|[A-Za-z0-9_-]+)\s*=\s*\[([\s\S]*?)]/g
  )) {
    const declaration = match[1] ?? "";
    for (const tool of ["pytest", "ruff", "mypy"] as const) {
      if (new RegExp(`["']${tool}(?:[<>=!~ ].*)?["']`, "i").test(declaration)) {
        tools.add(tool);
      }
    }
  }
  return tools;
}

function readCommandAuthorities(texts: ReadonlyMap<string, string>): CommandAuthority[] {
  const manifests: CommandAuthority[] = [];
  for (const [repositoryPath, text] of texts) {
    const basename = path.posix.basename(repositoryPath).toLowerCase();
    const directory = manifestDirectory(repositoryPath);
    if (basename === "package.json") {
      try {
        const parsed = JSON.parse(text) as { name?: unknown; scripts?: unknown };
        const scripts =
          parsed.scripts !== null &&
          typeof parsed.scripts === "object" &&
          !Array.isArray(parsed.scripts)
            ? Object.entries(parsed.scripts as Record<string, unknown>)
                .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
                .map(([name]) => name)
            : [];
        manifests.push({
          path: repositoryPath,
          directory,
          kind: "package-json",
          ...(typeof parsed.name === "string" && parsed.name.trim() !== ""
            ? { name: parsed.name }
            : {}),
          scripts: new Set(scripts),
          standardCommands: new Set()
        });
      } catch {
        // Invalid manifests are reported by the finding pass.
      }
    } else if (basename === "pyproject.toml") {
      manifests.push({
        path: repositoryPath,
        directory,
        kind: "python",
        scripts: readStaticPythonScripts(text),
        standardCommands: readDeclaredPythonTools(text)
      });
    } else if (basename === "cargo.toml") {
      manifests.push({
        path: repositoryPath,
        directory,
        kind: "cargo",
        scripts: new Set(),
        standardCommands: new Set(["build", "check", "clippy", "fmt", "test"])
      });
    } else if (basename === "go.mod") {
      manifests.push({
        path: repositoryPath,
        directory,
        kind: "go",
        scripts: new Set(),
        standardCommands: new Set(["build", "fmt", "test", "vet"])
      });
    } else if (basename === "pom.xml") {
      manifests.push({
        path: repositoryPath,
        directory,
        kind: "maven",
        scripts: new Set(),
        standardCommands: new Set(["compile", "package", "test", "verify"])
      });
    }
  }
  return manifests.sort((left, right) => compareCanonicalText(left.path, right.path));
}

interface DocumentationSection {
  heading: string;
  body: string;
}

function documentationSections(text: string): DocumentationSection[] {
  const sections: DocumentationSection[] = [];
  let heading = "";
  let body: string[] = [];
  const flush = (): void => {
    const content = body.join("\n").trim();
    if (content !== "") sections.push({ heading, body: content });
    body = [];
  };
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (match?.[1] !== undefined) {
      flush();
      heading = match[1].trim();
    } else {
      body.push(line);
    }
  }
  flush();
  return sections;
}

function evidenceExcerpt(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

function contextualDocumentationEvidence(
  documentation: readonly (readonly [string, string])[],
  kind: "constraint" | "risk"
): Evidence[] {
  const evidenceItems: Evidence[] = [];
  const relevantHeading =
    kind === "constraint"
      ? /^(?:constraints?|(?:platform|security|privacy|deployment) (?:constraints?|requirements?)|requirements?|compatibility|supported platforms?|limitations?)$/i
      : /^(?:risks?|safety|failure modes?|migration risks?|security threats?|data integrity risks?)$/i;
  const oppositeHeading =
    kind === "constraint"
      ? /^(?:risks?|safety|failure modes?|migration risks?|security threats?|data integrity risks?)$/i
      : /^(?:constraints?|(?:platform|security|privacy|deployment) (?:constraints?|requirements?)|requirements?|compatibility|supported platforms?|limitations?)$/i;
  const contextualSentence =
    kind === "constraint"
      ? /\b(?:must(?: not)?|required|requires|only supports?|restricted to|cannot|unsupported|compatible with|limited to|must run on|must preserve|remains undecided|tbd)\b/i
      : /\b(?:data loss|destructive behavior|breaking change|migration hazard|security threat|privacy exposure|irreversible operation|recovery failure|unresolved high-impact behavior)\b/i;

  for (const [repositoryPath, text] of documentation) {
    for (const section of documentationSections(text)) {
      const sentences = section.body
        .split(/(?<=[.!?])\s+|\n+/)
        .map(evidenceExcerpt)
        .filter(Boolean);
      const matchedSentence = relevantHeading.test(section.heading)
        ? sentences[0]
        : oppositeHeading.test(section.heading)
          ? undefined
          : sentences.find((sentence) => contextualSentence.test(sentence));
      if (matchedSentence === undefined) continue;
      evidenceItems.push({
        source: repositoryPath,
        detail: `${section.heading || "Documented requirement"}: ${matchedSentence}`
      });
      break;
    }
    if (evidenceItems.length >= 5) break;
  }
  return evidenceItems;
}

function detectContext(
  artifacts: readonly ArtifactRecord[],
  texts: ReadonlyMap<string, string>
): DetectedContext {
  const paths = new Set(artifacts.map((artifact) => artifact.path.toLowerCase()));
  const technologies = new Set<string>();
  if ([...paths].some((item) => /\.(ts|tsx|mts|cts)$/.test(item))) {
    technologies.add("TypeScript");
    technologies.add("Node.js");
  } else if ([...paths].some((item) => /\.(js|jsx|mjs|cjs)$/.test(item))) {
    technologies.add("JavaScript");
    technologies.add("Node.js");
  }
  if (paths.has("package.json") || [...paths].some((item) => item.endsWith("/package.json"))) {
    if (![...technologies].some((item) => item === "TypeScript" || item === "JavaScript")) {
      technologies.add("JavaScript");
    }
    technologies.add("Node.js");
  }
  if (paths.has("pyproject.toml") || [...paths].some((item) => item.endsWith(".py"))) {
    technologies.add("Python");
  }
  if (paths.has("cargo.toml") || [...paths].some((item) => item.endsWith(".rs"))) {
    technologies.add("Rust");
  }
  if (paths.has("go.mod") || [...paths].some((item) => item.endsWith(".go"))) {
    technologies.add("Go");
  }
  if (paths.has("pom.xml")) technologies.add("Java");

  const aiTools = new Set<string>();
  if (
    artifacts.some(
      (artifact) =>
        /(^|\/)AGENTS(?:\.override)?\.md$/i.test(artifact.path) ||
        /(^|\/)\.codex\//i.test(artifact.path)
    )
  ) {
    aiTools.add("Codex");
  }
  const currentDocumentation = [...texts.entries()]
    .filter(([repositoryPath]) =>
      /^(?:README(?:\.[^/]*)?\.md|docs\/(?!.*(?:archive|historical)\/).*\.md)$/i.test(
        repositoryPath
      )
    )
    .sort(([left], [right]) => compareCanonicalText(left, right));
  let inferredOutcome: DetectedContext["inferredOutcome"];
  for (const [repositoryPath, text] of currentDocumentation) {
    if (/\b(?:placeholder|todo: describe|coming soon)\b/i.test(text) && text.length < 500) continue;
    const heading = text.match(
      /^#{1,3}\s+(?:purpose|outcome|product|overview)\s*$\s*([^#][\s\S]*?)(?=\n#{1,3}\s|$)/im
    )?.[1];
    const paragraph = heading
      ?.split(/\n\s*\n/)
      .map((value) => value.replace(/\s+/g, " ").trim())
      .find(
        (value) =>
          value.length >= 60 &&
          !/^[-*>]/.test(value) &&
          /\b(?:builds?|creates?|delivers?|enables?|helps?|improves?|provides?|ships?|supports?)\b/i.test(
            value
          ) &&
          !/\b(?:project description|describe this project|lorem ipsum)\b/i.test(value)
      );
    if (paragraph !== undefined) {
      inferredOutcome = {
        value: paragraph.slice(0, 300),
        evidence: [evidence(repositoryPath, "Substantive current outcome documentation")]
      };
      break;
    }
  }
  return {
    technologies: [...technologies].sort(compareCanonicalText),
    aiTools: [...aiTools].sort(compareCanonicalText),
    manifests: readCommandAuthorities(texts),
    ...(inferredOutcome === undefined ? {} : { inferredOutcome }),
    constraintEvidence: contextualDocumentationEvidence(currentDocumentation, "constraint"),
    riskEvidence: contextualDocumentationEvidence(currentDocumentation, "risk")
  };
}

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function isWithinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (relative !== ".." && !relative.startsWith(".." + path.sep));
}

function isLikelySecret(repositoryPath: string): boolean {
  const normalized = normalizePath(repositoryPath).toLowerCase();
  const basename = path.posix.basename(normalized);
  const segments = normalized.split("/");
  return (
    basename === ".env" ||
    basename.startsWith(".env.") ||
    SECRET_BASENAMES.has(basename) ||
    /\.(key|pem|p12|pfx|jks|keystore)$/.test(basename) ||
    segments.some((segment) => [".ssh", ".aws", ".azure", ".gnupg", "secrets"].includes(segment))
  );
}

function ignoredReason(artifact: ArtifactRecord): FingerprintExclusion["reason"] | undefined {
  if (artifact.origin === "third-party") return "dependency";
  if (artifact.origin === "generated-vendor") return "generated-vendor";
  if (artifact.kind === "ignored-directory") return "cache";
  return undefined;
}

function isGovernancePath(repositoryPath: string): boolean {
  const lower = normalizePath(repositoryPath).toLowerCase();
  const basename = path.posix.basename(lower);
  return (
    /^(docs|specs|adr|adrs|decisions)(?:\/|$)/.test(lower) ||
    /^(readme|manifest|contributing|changelog)(\.|$)/.test(basename) ||
    basename === ".devcharter.yaml"
  );
}

function isEngineeringPath(repositoryPath: string, artifact: ArtifactRecord): boolean {
  const lower = normalizePath(repositoryPath).toLowerCase();
  const basename = path.posix.basename(lower);
  return (
    artifact.kind === "source" ||
    artifact.kind === "test" ||
    artifact.kind === "configuration" ||
    /^(src|app|apps|packages|lib|test|tests|scripts|config|infra|deploy)(?:\/|$)/.test(lower) ||
    /^\.github\/workflows\//.test(lower) ||
    MODE_CLASSIFICATION_NAMES.has(basename) ||
    /^(tsconfig|eslint|prettier|vitest|jest|webpack|vite|rollup|dockerfile)/.test(basename) ||
    /(^|\/)(makefile|justfile)$/.test(lower)
  );
}

function isAiPath(repositoryPath: string): boolean {
  const lower = normalizePath(repositoryPath).toLowerCase();
  const basename = path.posix.basename(lower);
  return (
    basename === "agents.md" ||
    basename === "agents.override.md" ||
    basename === "skills-lock.json" ||
    /^(\.agents|\.codex|prompts|agents|hooks|mcp)(\/|$)/.test(lower) ||
    /(^|\/)(ai|llm|openai|anthropic)([-_./]|$)/.test(lower)
  );
}

function isDeveloperAiConfigurationPath(repositoryPath: string): boolean {
  const lower = normalizePath(repositoryPath).toLowerCase();
  const basename = path.posix.basename(lower);
  return (
    basename === "agents.md" ||
    basename === "agents.override.md" ||
    /^(\.agents|\.codex|prompts|agents|hooks|mcp)(\/|$)/.test(lower)
  );
}

function isModeClassificationPath(repositoryPath: string, artifact: ArtifactRecord): boolean {
  const lower = normalizePath(repositoryPath).toLowerCase();
  const basename = path.posix.basename(lower);
  return (
    artifact.kind === "source" ||
    artifact.kind === "test" ||
    MODE_CLASSIFICATION_NAMES.has(basename) ||
    /^(src|app|apps|packages|lib|docs|specs|infra|deploy)\//.test(lower) ||
    /^readme(\.|$)/.test(basename)
  );
}

function pathRole(repositoryPath: string, artifact: ArtifactRecord): string[] {
  const roles: string[] = [];
  if (isGovernancePath(repositoryPath)) roles.push("governance");
  if (isEngineeringPath(repositoryPath, artifact)) roles.push("engineering");
  if (isAiPath(repositoryPath)) roles.push("ai");
  return roles;
}

function selectedByScope(roles: readonly string[], scope: Scope): boolean {
  return scope === "full" ? roles.length > 0 : roles.includes(scope);
}

function executeGit(root: string, arguments_: readonly string[]): Promise<string> {
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
      (error, stdout) => {
        if (error) reject(error);
        else resolve(stdout);
      }
    );
  });
}

const GIT_PREFIX = [
  "--no-optional-locks",
  "--no-pager",
  "-c",
  "core.fsmonitor=false",
  "-c",
  "core.untrackedCache=false"
] as const;

async function inspectGit(
  root: string,
  includedPaths: ReadonlySet<string>,
  runner: GitRunner
): Promise<FingerprintGitFact[]> {
  const gitPath = path.join(root, ".git");
  try {
    const details = await lstat(gitPath);
    if (!details.isDirectory() || details.isSymbolicLink()) {
      return [
        {
          name: "git",
          available: false,
          uncertainty: "Git metadata is not a contained directory"
        }
      ];
    }
    const canonicalGitPath = await realpath(gitPath);
    if (!isWithinRoot(root, canonicalGitPath)) {
      return [
        {
          name: "git",
          available: false,
          uncertainty: "Git metadata resolves outside the repository root"
        }
      ];
    }
  } catch {
    return [
      { name: "git", available: false, uncertainty: "Contained Git metadata is unavailable" }
    ];
  }

  const invocations = [
    ["rev-parse", "--show-toplevel"],
    ["rev-parse", "--verify", "HEAD^{commit}"],
    ["rev-list", "--count", "--max-count=2", "HEAD"],
    [
      "status",
      "--porcelain=v1",
      "-z",
      "--untracked-files=all",
      "--no-renames",
      "--ignore-submodules=all"
    ],
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]
  ] as const;
  const names = ["root", "head", "historyCount", "status", "trackedPaths"] as const;
  const facts: FingerprintGitFact[] = [];

  for (const [index, invocation] of invocations.entries()) {
    const name = names[index];
    if (name === undefined) continue;
    try {
      const output = await runner(root, [...GIT_PREFIX, ...invocation]);
      if (name === "status") {
        const entries = output
          .split("\0")
          .filter(Boolean)
          .filter((entry) => includedPaths.has(normalizePath(entry.slice(3))));
        facts.push({ name, available: true, value: entries });
      } else if (name === "trackedPaths") {
        const entries = output
          .split("\0")
          .filter(Boolean)
          .map(normalizePath)
          .filter((entry) => includedPaths.has(entry))
          .sort(compareCanonicalText);
        facts.push({ name, available: true, value: entries });
      } else if (name === "historyCount") {
        facts.push({ name, available: true, value: Number.parseInt(output.trim(), 10) || 0 });
      } else if (name === "root") {
        const reportedRoot = await realpath(output.trim());
        facts.push(
          path.resolve(reportedRoot) === path.resolve(root)
            ? { name, available: true, value: "." }
            : {
                name,
                available: false,
                uncertainty: "Git top level does not match the repository root"
              }
        );
      } else {
        facts.push({ name, available: true, value: output.trim() });
      }
    } catch (error) {
      facts.push({
        name,
        available: false,
        uncertainty: error instanceof Error ? error.message : "Git fact is unavailable"
      });
    }
  }
  return facts;
}

async function buildFingerprint(
  reader: RepositoryReader,
  scope: Scope,
  runner: GitRunner
): Promise<Result<FingerprintBuild>> {
  const inventory = await reader.inventory();
  if (!inventory.ok) return inventory;
  const provenance = await classifySkillProvenance(inventory.value, async (repositoryPath) => {
    const result = await reader.readText(repositoryPath);
    return result.ok ? result.value : undefined;
  });
  const artifacts = provenance.artifacts;

  const includedPaths: FingerprintPathInput[] = [];
  const excludedPaths: FingerprintExclusion[] = [];
  const texts = new Map<string, string>();
  const semanticallyInspectedPaths: string[] = [];

  for (const artifact of artifacts) {
    const ignored = ignoredReason(artifact);
    if (ignored !== undefined) {
      excludedPaths.push({ path: artifact.path, reason: ignored });
      continue;
    }
    const roles = pathRole(artifact.path, artifact);
    const selected = selectedByScope(roles, scope);
    const modeClassification = isModeClassificationPath(artifact.path, artifact);
    if (isLikelySecret(artifact.path)) {
      excludedPaths.push({ path: artifact.path, reason: "likely-secret" });
      continue;
    }
    if (BINARY_EXTENSIONS.has(path.posix.extname(artifact.path.toLowerCase()))) {
      excludedPaths.push({ path: artifact.path, reason: "binary" });
      continue;
    }
    if (!selected && !modeClassification) {
      excludedPaths.push({ path: artifact.path, reason: "out-of-scope" });
      continue;
    }
    if (artifact.kind === "symbolic-link") {
      excludedPaths.push({
        path: artifact.path,
        reason: "external-symlink",
        uncertainty: "Symbolic-link targets are never followed"
      });
      continue;
    }

    try {
      const absolutePath = path.join(reader.root, ...artifact.path.split("/"));
      const details = await lstat(absolutePath);
      if (!details.isFile()) {
        excludedPaths.push({ path: artifact.path, reason: "unsupported-type" });
        continue;
      }
      if (details.size > FINGERPRINT_LIMIT) {
        excludedPaths.push({
          path: artifact.path,
          reason: "oversized",
          detail: `File exceeds ${FINGERPRINT_LIMIT} bytes`,
          uncertainty: "Content changes are not represented in the fingerprint"
        });
        continue;
      }
      const buffer = await readFile(absolutePath);
      if (buffer.subarray(0, BINARY_PREFIX_LIMIT).includes(0)) {
        excludedPaths.push({ path: artifact.path, reason: "binary" });
        continue;
      }
      const text = buffer.toString("utf8");
      if (text.includes("\uFFFD")) {
        excludedPaths.push({ path: artifact.path, reason: "unsupported-type" });
        continue;
      }
      const reason = selected ? "selected-scope" : "mode-classification";
      const digest =
        reason === "mode-classification"
          ? sha256(`${artifact.kind}:${meaningfulSource(text) ? "substantive" : "minimal"}`)
          : sha256(text.replace(/\r\n?/g, "\n"));
      includedPaths.push({
        path: artifact.path,
        role: roles.length > 0 ? roles.sort(compareCanonicalText).join(",") : "project-structure",
        reason,
        type: "text",
        ...(reason === "selected-scope" ? { size: details.size } : {}),
        digest
      });
      if (details.size <= SEMANTIC_LIMIT) {
        texts.set(artifact.path, text);
      }
    } catch (error) {
      excludedPaths.push({
        path: artifact.path,
        reason: "unsafe",
        uncertainty: error instanceof Error ? error.message : "File could not be inspected safely"
      });
    }
  }

  const artifactByPath = new Map(artifacts.map((artifact) => [artifact.path, artifact]));
  const referenceQueue = [...texts.entries()];
  const alreadyIncluded = new Set(includedPaths.map((input) => input.path));
  for (let index = 0; index < referenceQueue.length; index += 1) {
    const entry = referenceQueue[index];
    if (entry === undefined) continue;
    const [sourcePath, sourceText] = entry;
    for (const target of extractReferencedTargets(sourcePath, sourceText, {
      includeImplicitInline: true
    })) {
      const resolvedPath = resolveReferencedPath(sourcePath, target);
      if (resolvedPath === undefined) continue;
      const rootCandidate = normalizePath(stripReferenceSuffix(target)).replace(/^\.\//, "");
      const referencedPath = artifactByPath.has(resolvedPath) ? resolvedPath : rootCandidate;
      const artifact = artifactByPath.get(referencedPath);
      if (artifact === undefined) continue;
      const existingIndex = includedPaths.findIndex((input) => input.path === referencedPath);
      if (existingIndex >= 0 && includedPaths[existingIndex]?.reason !== "mode-classification") {
        continue;
      }
      if (
        ignoredReason(artifact) !== undefined ||
        artifact.kind === "symbolic-link" ||
        isLikelySecret(referencedPath) ||
        BINARY_EXTENSIONS.has(path.posix.extname(referencedPath.toLowerCase()))
      ) {
        continue;
      }
      try {
        const absolutePath = path.join(reader.root, ...referencedPath.split("/"));
        const details = await lstat(absolutePath);
        if (!details.isFile() || details.size > FINGERPRINT_LIMIT) continue;
        const buffer = await readFile(absolutePath);
        if (buffer.subarray(0, BINARY_PREFIX_LIMIT).includes(0)) continue;
        const text = buffer.toString("utf8");
        if (text.includes("\uFFFD")) continue;
        const roles = pathRole(referencedPath, artifact);
        if (existingIndex >= 0) includedPaths.splice(existingIndex, 1);
        includedPaths.push({
          path: referencedPath,
          role:
            roles.length > 0
              ? roles.sort(compareCanonicalText).join(",")
              : "referenced-project-context",
          reason: "reference-dependency",
          type: "text",
          size: details.size,
          digest: sha256(text.replace(/\r\n?/g, "\n"))
        });
        alreadyIncluded.add(referencedPath);
        const exclusionIndex = excludedPaths.findIndex((item) => item.path === referencedPath);
        if (exclusionIndex >= 0) excludedPaths.splice(exclusionIndex, 1);
        if (details.size <= SEMANTIC_LIMIT) {
          texts.set(referencedPath, text);
          referenceQueue.push([referencedPath, text]);
        }
      } catch {
        // The original exclusion remains authoritative.
      }
    }
  }

  const runtimeAiEvidence = analyzeRuntimeAiEvidence({
    texts: scopeIncludes(scope, "ai") ? texts : new Map<string, string>(),
    productionSourcePaths: new Set(
      artifacts
        .filter((artifact) => artifact.origin === "project" && artifact.kind === "source")
        .map((artifact) => artifact.path)
    ),
    testSourcePaths: new Set(
      artifacts
        .filter((artifact) => artifact.origin === "project" && artifact.kind === "test")
        .map((artifact) => artifact.path)
    )
  });
  if (scopeIncludes(scope, "ai")) {
    for (const input of includedPaths) {
      if (input.reason !== "mode-classification" || input.digest === undefined) continue;
      input.digest = bindRuntimeAiFingerprintEvidence(input.digest, input.path, runtimeAiEvidence);
    }
  }

  includedPaths.sort((left, right) => compareCanonicalText(left.path, right.path));
  excludedPaths.sort((left, right) => compareCanonicalText(left.path, right.path));
  semanticallyInspectedPaths.sort(compareCanonicalText);
  const includedSet = new Set(includedPaths.map((input) => input.path));
  const gitFacts = await inspectGit(reader.root, includedSet, runner);
  const inputs: RepositoryFingerprintInputs = {
    algorithmVersion: 2,
    scope,
    includedPaths,
    excludedPaths,
    gitFacts
  };
  return success({
    artifacts,
    inputs,
    repositoryFingerprint: computeRepositoryFingerprint(inputs),
    texts,
    semanticallyInspectedPaths,
    skillProvenanceUncertainties: provenance.uncertainties,
    runtimeAiEvidence
  });
}

export function computeRepositoryFingerprint(inputs: RepositoryFingerprintInputs): string {
  return computeScopedRepositoryFingerprint(inputs);
}

function evidence(source: string, detail?: string): { source: string; detail?: string } {
  return { source, ...(detail === undefined ? {} : { detail }) };
}

function meaningfulSource(text: string): boolean {
  const compact = text.replace(/\s+/g, " ").trim().toLowerCase();
  return (
    compact.length >= 80 &&
    !/^(export \{\};?|hello world|todo|placeholder)/.test(compact) &&
    !compact.includes("welcome to vite")
  );
}

function isCurrentDocumentationPath(repositoryPath: string): boolean {
  const lower = normalizePath(repositoryPath).toLowerCase();
  return (
    isGovernancePath(repositoryPath) &&
    !/^(?:prompts|references)\//.test(lower) &&
    !/^specs\/(?:done|cancelled)\//.test(lower) &&
    !/(?:^|\/)(?:archive|historical)\//.test(lower)
  );
}

function recommendMode(
  artifacts: readonly ArtifactRecord[],
  texts: ReadonlyMap<string, string>,
  gitFacts: readonly FingerprintGitFact[]
): ModeRecommendation {
  const signals: EstablishmentSignal[] = [];
  const sourcePaths = artifacts
    .filter((artifact) => artifact.kind === "source")
    .map((item) => item.path);
  const substantialSources = sourcePaths.filter((repositoryPath) => {
    const text = texts.get(repositoryPath);
    return text !== undefined && meaningfulSource(text);
  });
  if (substantialSources.length > 0) {
    signals.push({
      kind: "material-source",
      strength: "strong",
      confidence: "high",
      evidence: [
        evidence(substantialSources[0] ?? "repository inventory", "Substantive source code")
      ]
    });
  }
  if (sourcePaths.some((repositoryPath) => /^(src|app|apps|packages)\//.test(repositoryPath))) {
    signals.push({
      kind: "application-structure",
      strength: substantialSources.length > 0 ? "strong" : "supporting",
      confidence: substantialSources.length > 0 ? "high" : "medium",
      evidence: [evidence("repository inventory", "Application source structure")]
    });
  }
  const history = gitFacts.find((fact) => fact.name === "historyCount" && fact.available);
  if (typeof history?.value === "number" && history.value >= 2) {
    signals.push({
      kind: "meaningful-history",
      strength: "supporting",
      confidence: "medium",
      evidence: [evidence("git rev-list", "History corroborates repository evidence")]
    });
  }
  const deploymentPath = artifacts.find((artifact) =>
    /(^|\/)(dockerfile|compose\.ya?ml|vercel\.json|netlify\.toml|fly\.toml)$/i.test(artifact.path)
  )?.path;
  if (deploymentPath !== undefined) {
    signals.push({
      kind: "deployed-configuration",
      strength: "strong",
      confidence: "medium",
      evidence: [evidence(deploymentPath)]
    });
  }
  const substantialDocumentation = [...texts.entries()].find(
    ([repositoryPath, text]) => isCurrentDocumentationPath(repositoryPath) && text.length >= 2000
  );
  if (substantialDocumentation !== undefined) {
    signals.push({
      kind: "substantial-documentation",
      strength: "strong",
      confidence: "medium",
      evidence: [evidence(substantialDocumentation[0], "Substantial current documentation")]
    });
  }
  if (artifacts.some((artifact) => artifact.kind === "test")) {
    signals.push({
      kind: "tests",
      strength: "supporting",
      confidence: "high",
      evidence: [evidence("repository inventory", "Project tests detected")]
    });
  }

  const packageText = texts.get("package.json");
  if (packageText !== undefined) {
    try {
      const packageJson = JSON.parse(packageText) as {
        scripts?: Record<string, unknown>;
        dependencies?: Record<string, unknown>;
        devDependencies?: Record<string, unknown>;
      };
      const count =
        Object.keys(packageJson.scripts ?? {}).length +
        Object.keys(packageJson.dependencies ?? {}).length +
        Object.keys(packageJson.devDependencies ?? {}).length;
      signals.push({
        kind: count >= 3 ? "nontrivial-manifest" : "minimal-manifest",
        strength: count >= 3 ? "supporting" : "minimal",
        confidence: "high",
        evidence: [evidence("package.json", `${count} scripts or dependencies`)]
      });
    } catch {
      // Invalid manifest analysis is reported separately.
    }
  }

  if (signals.length === 0 && artifacts.some((artifact) => /^readme/i.test(artifact.path))) {
    signals.push({
      kind: "readme-only",
      strength: "minimal",
      confidence: "high",
      evidence: [evidence("README", "No stronger establishment evidence")]
    });
  }

  const strongSignal = signals.find((signal) => signal.strength === "strong");
  if (strongSignal !== undefined) {
    return { recommendedMode: "retrofit", confidence: strongSignal.confidence, signals };
  }
  const hasEstablishedStructure = signals.some(
    (signal) => signal.kind === "application-structure" && signal.strength === "supporting"
  );
  const hasOperationalSupport = signals.some(
    (signal) => signal.kind === "tests" || signal.kind === "nontrivial-manifest"
  );
  if (hasEstablishedStructure && hasOperationalSupport) {
    return { recommendedMode: "retrofit", confidence: "medium", signals };
  }
  if (signals.some((signal) => signal.strength === "supporting")) {
    return {
      recommendedMode: "new",
      confidence: "low",
      signals,
      uncertainty: "One supporting establishment signal is not decisive"
    };
  }
  return { recommendedMode: "new", confidence: "high", signals };
}

function finding(
  code: string,
  summary: string,
  source: string | Evidence[],
  scope: Scope,
  recommendedAction: string,
  impact: Finding["impact"] = "medium",
  confidence: Confidence = "high"
): Finding {
  return {
    code,
    summary,
    evidence: typeof source === "string" ? [evidence(source)] : source,
    scope,
    impact,
    confidence,
    recommendedAction
  };
}

interface CommandReference {
  authorityKind: CommandAuthorityKind;
  runner: string;
  command: string;
  selector?: string;
  uncertainty?: string;
}

const COMMAND_RUNNER_PATTERN = "(?:pnpm|npm|yarn|bun|cargo|go|mvnw?|pytest|ruff|mypy|python\\s+-m)";

function parseCommandReference(source: string): CommandReference | undefined {
  const js = source.match(
    /\b(pnpm|npm|yarn|bun)\s+(?:(?:--filter|--workspace|-w)\s+([^\s`"']+)\s+|workspace\s+([^\s`"']+)\s+)?(?:run\s+)?([A-Za-z0-9:_-]+)/i
  );
  if (js !== null) {
    const runner = js[1]?.toLowerCase();
    const command = js[4];
    if (runner === undefined || command === undefined) return undefined;
    if (
      PACKAGE_MANAGER_BUILTINS.has(command) ||
      (runner === "bun" && command === "test" && !/\bbun\s+run\b/i.test(js[0]))
    ) {
      return undefined;
    }
    const selector = js[2] ?? js[3] ?? source.match(/--workspace(?:=|\s+)([^\s`"']+)/i)?.[1];
    return {
      authorityKind: "package-json",
      runner,
      command,
      ...(selector === undefined ? {} : { selector })
    };
  }

  const native = source.match(/\b(cargo|go|mvnw?|pytest|ruff|mypy|python\s+-m)\s+([^\s`"']+)/i);
  if (native !== null) {
    const runner = native[1]?.toLowerCase();
    const token = native[2]?.replace(/^\.+\//, "");
    if (runner === undefined || token === undefined) return undefined;
    const kind: CommandAuthorityKind =
      runner === "cargo"
        ? "cargo"
        : runner === "go"
          ? "go"
          : /^mvn/.test(runner)
            ? "maven"
            : "python";
    const command =
      runner === "python -m"
        ? token
        : runner === "pytest" || runner === "ruff" || runner === "mypy"
          ? runner
          : token;
    return { authorityKind: kind, runner, command };
  }

  if (new RegExp(`\\b${COMMAND_RUNNER_PATTERN}\\b`, "i").test(source)) {
    const runner =
      source.match(new RegExp(`\\b(${COMMAND_RUNNER_PATTERN})\\b`, "i"))?.[1] ?? "command";
    return {
      authorityKind: /cargo/i.test(runner)
        ? "cargo"
        : /^go$/i.test(runner)
          ? "go"
          : /mvn/i.test(runner)
            ? "maven"
            : /python|pytest|ruff|mypy/i.test(runner)
              ? "python"
              : "package-json",
      runner: runner.toLowerCase(),
      command: "(dynamic)",
      uncertainty:
        "The command name is dynamic or unsupported and cannot be validated deterministically"
    };
  }
  return undefined;
}

function extractCommandReferences(
  text: string,
  context: "documentation" | "ci"
): CommandReference[] {
  const references = new Map<string, CommandReference>();
  const sources: string[] = [];
  if (context === "documentation") {
    for (const match of text.matchAll(
      new RegExp("`([^`\\r\\n]*\\b" + COMMAND_RUNNER_PATTERN + "\\s+[^`\\r\\n]+)`", "gi")
    )) {
      if (match[1] !== undefined) sources.push(match[1]);
    }
    for (const match of text.matchAll(
      new RegExp("(?:^|\\n)\\s*(?:\\$\\s+)?(" + COMMAND_RUNNER_PATTERN + "\\s+[^\\r\\n]+)", "gi")
    )) {
      if (match[1] !== undefined) sources.push(match[1]);
    }
    for (const match of text.matchAll(
      new RegExp("\\brun\\s+(" + COMMAND_RUNNER_PATTERN + "\\s+[^.\\r\\n]+)", "gi")
    )) {
      if (match[1] !== undefined) sources.push(match[1]);
    }
  } else {
    for (const match of text.matchAll(
      new RegExp(
        "(?:^|\\n)\\s*(?:-\\s*)?run:\\s*(?:[>|]\\s*)?(" +
          COMMAND_RUNNER_PATTERN +
          "\\s+[^\\r\\n]+)",
        "gi"
      )
    )) {
      if (match[1] !== undefined) sources.push(match[1]);
    }
  }
  for (const source of sources) {
    const reference = parseCommandReference(source);
    if (reference === undefined) continue;
    const key = `${reference.authorityKind}:${reference.selector ?? ""}:${reference.command}`;
    references.set(key, reference);
  }
  return [...references.values()].sort((left, right) =>
    compareCanonicalText(
      `${left.authorityKind}:${left.selector ?? ""}:${left.command}`,
      `${right.authorityKind}:${right.selector ?? ""}:${right.command}`
    )
  );
}

function manifestsForReference(
  sourcePath: string,
  reference: CommandReference,
  manifests: readonly CommandAuthority[]
): CommandAuthority[] {
  const matchingKind = manifests.filter((manifest) => manifest.kind === reference.authorityKind);
  if (reference.selector !== undefined) {
    const selector = reference.selector;
    return matchingKind.filter(
      (manifest) =>
        manifest.name === selector ||
        path.posix.basename(manifest.directory) === selector ||
        manifest.directory === normalizePath(selector).replace(/^\.\//, "")
    );
  }
  const sourceDirectory =
    path.posix.dirname(sourcePath) === "." ? "" : path.posix.dirname(sourcePath);
  const applicable = matchingKind.filter(
    (manifest) =>
      manifest.directory === "" ||
      sourceDirectory === manifest.directory ||
      sourceDirectory.startsWith(manifest.directory + "/")
  );
  const nearestLength = Math.max(-1, ...applicable.map((manifest) => manifest.directory.length));
  return applicable.filter((manifest) => manifest.directory.length === nearestLength);
}

function findingScopeForPath(repositoryPath: string): Exclude<Scope, "full"> {
  if (isAiPath(repositoryPath)) return "ai";
  if (isGovernancePath(repositoryPath)) return "governance";
  return "engineering";
}

function isConflictFinding(item: Finding): boolean {
  return CONFLICT_FINDING_CODES.has(item.code);
}

function analyzeFindings(
  artifacts: readonly ArtifactRecord[],
  texts: ReadonlyMap<string, string>,
  scope: Scope,
  recommendation: ModeRecommendation,
  context: DetectedContext,
  criticalJourneys: readonly CriticalJourney[]
): Finding[] {
  const findings: Finding[] = [];
  const paths = new Set(artifacts.map((artifact) => artifact.path));
  const pathExists = (candidate: string): boolean => {
    const normalized = candidate.replace(/\/$/, "");
    return paths.has(normalized) || [...paths].some((item) => item.startsWith(normalized + "/"));
  };
  const specIds = new Map<string, string>();
  const allSpecIds = new Set(
    [...texts.entries()]
      .filter(([repositoryPath]) => /^specs\/.*\.md$/i.test(repositoryPath))
      .map(([, text]) => text.match(/\|\s*ID\s*\|\s*(SPEC-[^|\s]+)\s*\|/i)?.[1])
      .filter((value): value is string => value !== undefined)
  );

  for (const [repositoryPath, text] of texts) {
    const specification = /^specs\/.*\.md$/i.test(repositoryPath);
    const markdown = /\.(md|mdx)$/i.test(repositoryPath);
    const specId = specification
      ? text.match(/\|\s*ID\s*\|\s*(SPEC-[^|\s]+)\s*\|/i)?.[1]
      : undefined;
    if (specId !== undefined) {
      const previous = specIds.get(specId);
      if (previous !== undefined && previous !== repositoryPath) {
        findings.push(
          finding(
            "DUPLICATE_SPEC_ID",
            `${specId} is defined by multiple files`,
            [evidence(previous), evidence(repositoryPath)],
            "governance",
            "Select one authoritative specification"
          )
        );
        findings.push(
          finding(
            "SPEC_PRECEDENCE_CONFLICT",
            `${specId} has no single authoritative status location`,
            [evidence(previous), evidence(repositoryPath)],
            "governance",
            "Resolve specification precedence and retain one authoritative definition",
            "high"
          )
        );
      } else specIds.set(specId, repositoryPath);
    }
    const directoryStatus = repositoryPath.match(/^specs\/(ready|active|done|cancelled)\//)?.[1];
    const declaredStatus = text.match(
      /\|\s*Status\s*\|\s*(draft|ready|active|done|cancelled)\s*\|/i
    )?.[1];
    if (
      directoryStatus !== undefined &&
      declaredStatus !== undefined &&
      directoryStatus !== declaredStatus
    ) {
      findings.push(
        finding(
          "SPEC_STATUS_PATH_CONFLICT",
          `Specification status ${declaredStatus} conflicts with directory ${directoryStatus}`,
          repositoryPath,
          "governance",
          "Synchronize specification metadata and location",
          "high"
        )
      );
    }

    if (specification) {
      for (const relationship of text.matchAll(
        /\|\s*(?:Supersedes|Superseded by|superseded_by)\s*\|\s*(SPEC-[^|\s]+)\s*\|/gi
      )) {
        const targetId = relationship[1];
        if (targetId !== undefined && !allSpecIds.has(targetId)) {
          findings.push(
            finding(
              "BROKEN_SPEC_RELATIONSHIP",
              `Specification relationship references missing ${targetId}`,
              repositoryPath,
              "governance",
              "Repair the explicit supersession relationship"
            )
          );
        }
      }
    }

    if (!markdown && !/(^|\/)AGENTS(?:\.override)?\.md$/i.test(repositoryPath)) continue;
    for (const target of extractReferencedTargets(repositoryPath, text)) {
      const resolved = resolveReferencedPath(repositoryPath, target);
      if (resolved === undefined) continue;
      const rootCandidate = normalizePath(stripReferenceSuffix(target)).replace(/^\.\//, "");
      if (!pathExists(resolved) && !pathExists(rootCandidate)) {
        findings.push(
          finding(
            "BROKEN_REFERENCE",
            `Referenced path does not exist: ${target}`,
            repositoryPath,
            isAiPath(repositoryPath) ? "ai" : "governance",
            "Repair or remove the broken reference"
          )
        );
      }
    }
  }

  for (const [repositoryPath, packageText] of texts) {
    if (!/(^|\/)package\.json$/i.test(repositoryPath)) continue;
    try {
      JSON.parse(packageText);
    } catch {
      findings.push(
        finding(
          "INVALID_MANIFEST",
          `${repositoryPath} could not be parsed`,
          repositoryPath,
          "engineering",
          "Repair the project manifest",
          "high"
        )
      );
    }
  }

  for (const [repositoryPath, text] of texts) {
    const documentation = /\.(md|mdx)$/i.test(repositoryPath);
    const ci =
      /^\.github\/workflows\/.*\.ya?ml$/i.test(repositoryPath) ||
      /(^|\/)\.gitlab-ci\.ya?ml$/i.test(repositoryPath);
    if (!documentation && !ci) continue;
    for (const reference of extractCommandReferences(text, ci ? "ci" : "documentation")) {
      if (reference.uncertainty !== undefined) {
        findings.push({
          ...finding(
            "COMMAND_VALIDATION_UNCERTAIN",
            `${ci ? "CI" : "Documented"} command cannot be validated deterministically`,
            repositoryPath,
            "engineering",
            "Replace the dynamic command with an explicit repository-native command or document its authority",
            "low",
            "low"
          ),
          uncertainty: reference.uncertainty
        });
        continue;
      }
      const manifests = manifestsForReference(repositoryPath, reference, context.manifests);
      if (manifests.length > 1) {
        findings.push(
          finding(
            "COMMAND_AUTHORITY_AMBIGUOUS",
            `${ci ? "CI" : "Documented"} ${reference.runner} command has multiple applicable manifests: ${reference.command}`,
            [evidence(repositoryPath), ...manifests.map((manifest) => evidence(manifest.path))],
            "engineering",
            "Resolve the package selector or manifest authority before changing the command",
            "high"
          )
        );
        continue;
      }
      const manifest = manifests[0];
      if (
        manifest?.scripts.has(reference.command) === true ||
        manifest?.standardCommands.has(reference.command) === true
      ) {
        continue;
      }
      if (manifest !== undefined && reference.authorityKind !== "package-json") {
        findings.push({
          ...finding(
            "COMMAND_VALIDATION_UNCERTAIN",
            `${ci ? "CI" : "Documented"} ${reference.runner} command is not a bounded standard command: ${reference.command}`,
            [evidence(repositoryPath), evidence(manifest.path)],
            "engineering",
            "Document the command authority or use a statically declared project command",
            "low",
            "low"
          ),
          uncertainty: "Third-party plugins and dynamically installed tools are not interpreted"
        });
        continue;
      }
      findings.push(
        finding(
          ci ? "CI_COMMAND_MISSING" : "DOCUMENTED_COMMAND_MISSING",
          `${ci ? "CI" : "Documented"} ${reference.runner} command has no applicable authority: ${reference.command}`,
          repositoryPath,
          "engineering",
          "Synchronize documentation, CI, and the applicable package scripts"
        )
      );
    }
  }

  if (scopeIncludes(scope, "engineering") && recommendation.recommendedMode === "retrofit") {
    const hasVerificationScript = context.manifests.some((manifest) =>
      [...manifest.scripts, ...manifest.standardCommands].some((script) =>
        VERIFICATION_COMMAND_NAMES.has(script)
      )
    );
    const hasTests = artifacts.some((artifact) => artifact.kind === "test");
    const hasCi = artifacts.some((artifact) =>
      /(^\.github\/workflows\/.*\.ya?ml$)|((^|\/)\.gitlab-ci\.ya?ml$)/i.test(artifact.path)
    );
    if (!hasVerificationScript && !hasTests && !hasCi) {
      const source =
        context.manifests[0]?.path ??
        artifacts.find((artifact) => artifact.kind === "source")?.path ??
        "repository inventory";
      findings.push(
        finding(
          "MISSING_VERIFICATION",
          "Established implementation has no detected verification command, test, or CI workflow",
          source,
          "engineering",
          "Define the narrowest repository-native verification workflow",
          "high"
        )
      );
    }
  }

  if (
    scope !== "ai" &&
    recommendation.recommendedMode === "retrofit" &&
    criticalJourneys.length === 0
  ) {
    const source =
      context.manifests[0]?.path ??
      artifacts.find((artifact) => isCurrentDocumentationPath(artifact.path))?.path ??
      artifacts.find((artifact) => artifact.kind === "source")?.path ??
      "repository inventory";
    findings.push(
      finding(
        "MISSING_CRITICAL_JOURNEY_EVIDENCE",
        "Established repository has no explicit critical developer or user journey evidence",
        source,
        scope === "governance" ? "governance" : "engineering",
        "Document or test the smallest critical workflow that verification must protect",
        "medium",
        "medium"
      )
    );
  }

  if (scopeIncludes(scope, "ai")) {
    const aiTexts = [...texts.entries()].filter(
      ([repositoryPath, text]) =>
        isAiPath(repositoryPath) &&
        !/(^|\/)package\.json$/i.test(repositoryPath) &&
        text.trim().length >= 20
    );
    const byDigest = new Map<string, string[]>();
    for (const [repositoryPath, text] of aiTexts) {
      const digest = sha256(text.replace(/\r\n?/g, "\n").trim());
      const group = byDigest.get(digest) ?? [];
      group.push(repositoryPath);
      byDigest.set(digest, group);
    }
    for (const duplicates of byDigest.values()) {
      if (duplicates.length < 2) continue;
      duplicates.sort(compareCanonicalText);
      findings.push(
        finding(
          "DUPLICATE_AI_MATERIAL",
          "AI instruction or prompt content is duplicated",
          duplicates.map((repositoryPath) => evidence(repositoryPath)),
          "ai",
          "Retain one authoritative procedure and route consumers to it"
        )
      );
    }

    const instructionPaths = artifacts
      .map((artifact) => artifact.path)
      .filter((repositoryPath) => /(^|\/)AGENTS(?:\.override)?\.md$/i.test(repositoryPath));
    const instructionNames = new Map<string, string[]>();
    for (const repositoryPath of instructionPaths) {
      const key = repositoryPath.toLowerCase();
      const entries = instructionNames.get(key) ?? [];
      entries.push(repositoryPath);
      instructionNames.set(key, entries);
    }
    for (const ambiguous of instructionNames.values()) {
      if (ambiguous.length < 2) continue;
      findings.push(
        finding(
          "INSTRUCTION_ROUTING_CONFLICT",
          "Instruction files differ only by case and have ambiguous cross-platform precedence",
          ambiguous.map((repositoryPath) => evidence(repositoryPath)),
          "ai",
          "Retain one canonically named instruction file",
          "high"
        )
      );
    }

    const aiComponents = artifacts
      .map((artifact) => artifact.path)
      .filter((repositoryPath) => /^(agents|hooks|mcp|prompts)\//i.test(repositoryPath));
    if (
      aiComponents.length >= 4 &&
      !instructionPaths.some((repositoryPath) =>
        /^AGENTS(?:\.override)?\.md$/i.test(repositoryPath)
      )
    ) {
      findings.push(
        finding(
          "UNJUSTIFIED_AI_COMPLEXITY",
          "Multiple AI components exist without a root instruction route",
          aiComponents.slice(0, 5).map((repositoryPath) => evidence(repositoryPath)),
          "ai",
          "Justify and route the components or consolidate redundant material",
          "medium",
          "medium"
        )
      );
    }
  }

  for (const [repositoryPath, text] of texts) {
    const artifact = artifacts.find((item) => item.path === repositoryPath);
    if (artifact?.origin !== "project") continue;
    if (!/^\s*(?:\/\/|#|<!--)\s*@?generated\b/im.test(text.slice(0, 1024))) continue;
    findings.push(
      finding(
        "UNKNOWN_GENERATED_OWNERSHIP",
        "Generated-looking file has no trusted ownership classification",
        repositoryPath,
        findingScopeForPath(repositoryPath),
        "Confirm provenance and ownership before proposing any update",
        "high",
        "medium"
      )
    );
  }

  const relevant = scope === "full" ? findings : findings.filter((item) => item.scope === scope);
  const unique = new Map<string, Finding>();
  for (const item of relevant) {
    const key = `${item.code}:${item.evidence.map((entry) => entry.source).join("|")}:${item.summary}`;
    unique.set(key, item);
  }
  return [...unique.values()].sort((left, right) =>
    compareCanonicalText(
      `${left.code}:${left.evidence[0]?.source ?? ""}`,
      `${right.code}:${right.evidence[0]?.source ?? ""}`
    )
  );
}

function collectSemanticallyAnalyzedPaths(
  fingerprint: FingerprintBuild,
  scope: Scope,
  context: DetectedContext,
  findings: readonly Finding[]
): string[] {
  const analyzed = new Set<string>();
  const artifactByPath = new Map(
    fingerprint.artifacts.map((artifact) => [artifact.path, artifact])
  );
  const mark = (repositoryPath: string): void => {
    if (
      fingerprint.texts.has(repositoryPath) &&
      artifactByPath.get(repositoryPath)?.origin === "project"
    ) {
      analyzed.add(repositoryPath);
    }
  };

  for (const finding of findings) {
    for (const item of finding.evidence) mark(item.source);
  }
  for (const manifest of context.manifests) {
    if (scopeIncludes(scope, "engineering") || scopeIncludes(scope, "ai")) mark(manifest.path);
  }
  if (context.inferredOutcome !== undefined) {
    for (const item of context.inferredOutcome.evidence) mark(item.source);
  }
  for (const item of [...context.constraintEvidence, ...context.riskEvidence]) mark(item.source);

  for (const [repositoryPath, text] of fingerprint.texts) {
    const artifact = artifactByPath.get(repositoryPath);
    if (artifact?.origin !== "project") continue;
    const roles = pathRole(repositoryPath, artifact);
    if (!selectedByScope(roles, scope)) continue;
    if (/\.(?:md|mdx)$/i.test(repositoryPath)) mark(repositoryPath);
    if (scopeIncludes(scope, "ai") && isDeveloperAiConfigurationPath(repositoryPath)) {
      mark(repositoryPath);
    }
    if (
      scopeIncludes(scope, "engineering") &&
      /(^\.github\/workflows\/.*\.ya?ml$)|((^|\/)\.gitlab-ci\.ya?ml$)/i.test(repositoryPath)
    ) {
      mark(repositoryPath);
    }
    if (
      scopeIncludes(scope, "engineering") &&
      /(^|\/)(?:e2e|playwright|cypress)(\/|$)|\.e2e\./i.test(repositoryPath) &&
      /\b(?:test|it)\s*\(\s*["'`][^"'`]+["'`]/.test(text)
    ) {
      mark(repositoryPath);
    }
    if (/^\s*(?:\/\/|#|<!--)\s*@?generated\b/im.test(text.slice(0, 1024))) {
      mark(repositoryPath);
    }
  }

  if (scopeIncludes(scope, "ai")) {
    for (const repositoryPath of fingerprint.runtimeAiEvidence.matchedImportsBySource.keys()) {
      mark(repositoryPath);
    }
    for (const dependency of fingerprint.runtimeAiEvidence.dependencies) {
      mark(dependency.manifestPath);
    }
  }

  return [...analyzed].sort(compareCanonicalText);
}

function buildFacts(
  fingerprint: FingerprintBuild,
  recommendation: ModeRecommendation,
  scope: Scope,
  context: DetectedContext
): ProjectFact[] {
  const selectedSemanticPaths = fingerprint.inputs.includedPaths
    .filter((input) => input.reason !== "mode-classification")
    .map((input) => input.path)
    .filter((repositoryPath) => fingerprint.semanticallyInspectedPaths.includes(repositoryPath));
  const recommendationEvidence = recommendation.signals
    .flatMap((signal) => signal.evidence)
    .slice(0, 10);
  const facts: ProjectFact[] = [
    {
      key: "repository.artifactCount",
      value: fingerprint.artifacts.length,
      state: "confirmed",
      evidence: [evidence("repository inventory")]
    },
    {
      key: "repository.semanticInspectionPaths",
      value: selectedSemanticPaths,
      state: "confirmed",
      evidence: [evidence("fingerprint input manifest")]
    },
    {
      key: "repository.recommendedMode",
      value: recommendation.recommendedMode,
      state: "inferred",
      confidence: recommendation.confidence,
      evidence:
        recommendationEvidence.length > 0
          ? recommendationEvidence
          : [evidence("repository inventory")]
    }
  ];

  if (scopeIncludes(scope, "governance")) {
    const specificationAuthorities = new Map<string, string[]>();
    for (const [repositoryPath, text] of fingerprint.texts) {
      if (!/^specs\/.*\.md$/i.test(repositoryPath)) continue;
      const specId = text.match(/\|\s*ID\s*\|\s*(SPEC-[^|\s]+)\s*\|/i)?.[1];
      if (specId === undefined) continue;
      const paths = specificationAuthorities.get(specId) ?? [];
      paths.push(repositoryPath);
      specificationAuthorities.set(specId, paths);
    }
    if (specificationAuthorities.size > 0) {
      facts.push({
        key: "governance.specificationAuthorities",
        value: Object.fromEntries(
          [...specificationAuthorities.entries()]
            .sort(([left], [right]) => compareCanonicalText(left, right))
            .map(([id, paths]) => [id, paths.sort(compareCanonicalText)])
        ),
        state: "confirmed",
        evidence: [...specificationAuthorities.values()]
          .flat()
          .slice(0, 10)
          .map((source) => evidence(source))
      });
    }
  }

  if (scopeIncludes(scope, "engineering")) {
    if (context.technologies.length > 0) {
      facts.push({
        key: "engineering.technologies",
        value: context.technologies,
        state: "inferred",
        confidence: "high",
        evidence: [evidence("repository manifests and source extensions")]
      });
    }
    if (context.manifests.length > 0) {
      facts.push({
        key: "engineering.commandAuthorities",
        value: context.manifests.map((manifest) => ({
          path: manifest.path,
          kind: manifest.kind,
          scripts: [...manifest.scripts].sort(compareCanonicalText),
          standardCommands: [...manifest.standardCommands].sort(compareCanonicalText)
        })),
        state: "confirmed",
        evidence: context.manifests.slice(0, 10).map((manifest) => evidence(manifest.path))
      });
    }
  }

  if (scopeIncludes(scope, "ai")) {
    const developerAiPaths = fingerprint.artifacts
      .filter(
        (artifact) => artifact.origin === "project" && isDeveloperAiConfigurationPath(artifact.path)
      )
      .map((artifact) => artifact.path)
      .sort(compareCanonicalText);
    const instructionPaths = developerAiPaths.filter((repositoryPath) =>
      /(^|\/)AGENTS(?:\.override)?\.md$/i.test(repositoryPath)
    );
    if (instructionPaths.length > 0) {
      const overrideDirectories = new Set(
        instructionPaths
          .filter((repositoryPath) => /AGENTS\.override\.md$/i.test(repositoryPath))
          .map((repositoryPath) => path.posix.dirname(repositoryPath).toLowerCase())
      );
      facts.push({
        key: "ai.instructionAuthorities",
        value: instructionPaths.map((repositoryPath) => ({
          path: repositoryPath,
          appliesTo:
            path.posix.dirname(repositoryPath) === "." ? "/" : path.posix.dirname(repositoryPath),
          kind: /AGENTS\.override\.md$/i.test(repositoryPath) ? "override" : "base",
          effective:
            /AGENTS\.override\.md$/i.test(repositoryPath) ||
            !overrideDirectories.has(path.posix.dirname(repositoryPath).toLowerCase())
        })),
        state: "confirmed",
        evidence: instructionPaths.map((source) => evidence(source))
      });
    }
    if (context.aiTools.length > 0) {
      facts.push({
        key: "ai.selectedTools",
        value: context.aiTools,
        state: "inferred",
        confidence: "high",
        evidence:
          instructionPaths.length > 0
            ? instructionPaths.map((source) => evidence(source))
            : [evidence("repository AI configuration")]
      });
    }
    if (developerAiPaths.length > 0) {
      facts.push({
        key: "ai.developerConfiguration",
        value: developerAiPaths,
        state: "confirmed",
        evidence: developerAiPaths.slice(0, 5).map((source) => evidence(source))
      });
    }

    const runtimeDependencies = fingerprint.runtimeAiEvidence.matchedDependencies;
    const unconfirmedDependencies = fingerprint.runtimeAiEvidence.unmatchedDependencies;
    if (runtimeDependencies.length > 0) {
      const matchingSources = [...fingerprint.runtimeAiEvidence.matchedImportsBySource.keys()];
      facts.push({
        key: "ai.runtimeImplementation",
        value: [...new Set(runtimeDependencies.map((dependency) => dependency.name))].sort(
          compareCanonicalText
        ),
        state: "inferred",
        confidence: "high",
        evidence: [...new Set(runtimeDependencies.map((dependency) => dependency.manifestPath))]
          .map((source) => evidence(source))
          .concat(matchingSources.slice(0, 5).map((source) => evidence(source)))
      });
    }
    if (unconfirmedDependencies.length > 0) {
      facts.push({
        key: "ai.unusedOrUnconfirmedDependencies",
        value: [...new Set(unconfirmedDependencies.map((dependency) => dependency.name))].sort(
          compareCanonicalText
        ),
        state: "inferred",
        confidence: "medium",
        evidence: [
          ...new Set(unconfirmedDependencies.map((dependency) => dependency.manifestPath))
        ].map((source) => evidence(source))
      });
    }
  }
  return facts;
}

function safeDecisionPath(value: string): boolean {
  const normalized = normalizePath(value);
  const segments = normalized.split("/");
  return (
    value === normalized &&
    normalized.length > 0 &&
    !path.posix.isAbsolute(normalized) &&
    !path.win32.isAbsolute(normalized) &&
    !/^[A-Za-z]:/.test(normalized) &&
    segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..")
  );
}

function validateDecisionSet(decisions: readonly AcceptedDecision[]): string | undefined {
  const seen = new Set<string>();
  for (const decision of decisions) {
    if (!DECISION_IDS.has(decision.id)) return `Unknown accepted decision: ${decision.id}`;
    if (seen.has(decision.id)) return `Accepted decision is duplicated: ${decision.id}`;
    seen.add(decision.id);
    if (decision.id === "project.outcome") {
      if (typeof decision.value !== "string" || decision.value.trim() === "") {
        return "project.outcome must be a non-empty string";
      }
    } else if (decision.id === "project.mode") {
      if (decision.value !== "new" && decision.value !== "retrofit") {
        return "project.mode must be new or retrofit";
      }
    } else if (decision.id === "project.manifestPath") {
      if (typeof decision.value !== "string" || !safeDecisionPath(decision.value)) {
        return "project.manifestPath must be a safe repository-relative path using forward slashes";
      }
    } else {
      if (
        !Array.isArray(decision.value) ||
        decision.value.some((item) => typeof item !== "string" || item.trim() === "")
      ) {
        return `${decision.id} must be an array of non-empty strings`;
      }
      if (
        (decision.id === "project.technologies" || decision.id === "project.aiTools") &&
        decision.value.length === 0
      ) {
        return `${decision.id} must contain at least one value`;
      }
    }
  }
  return undefined;
}

function decisionValue<T extends JsonValue>(
  decisions: readonly AcceptedDecision[],
  id: string
): T | undefined {
  return decisions.find((decision) => decision.id === id)?.value as T | undefined;
}

function inferredManifestPath(
  artifacts: readonly ArtifactRecord[],
  context: DetectedContext,
  decisions: readonly AcceptedDecision[]
): string | undefined {
  const explicit = decisionValue<string>(decisions, "project.manifestPath");
  if (explicit !== undefined) return explicit;
  const rootManifest = context.manifests.find((manifest) => manifest.directory === "");
  if (rootManifest !== undefined) return rootManifest.path;
  if (context.manifests.length === 1) return context.manifests[0]?.path;
  const chosen = decisionValue<string[]>(decisions, "project.technologies") ?? context.technologies;
  const normalized = chosen.map((item) => item.toLowerCase());
  if (normalized.some((item) => /typescript|javascript|node/.test(item))) return "package.json";
  if (normalized.some((item) => item === "python")) return "pyproject.toml";
  if (normalized.some((item) => item === "rust")) return "Cargo.toml";
  if (normalized.some((item) => item === "go" || item === "golang")) return "go.mod";
  if (normalized.some((item) => /java|kotlin/.test(item))) return "pom.xml";
  return artifacts.find((artifact) =>
    MODE_CLASSIFICATION_NAMES.has(path.posix.basename(artifact.path).toLowerCase())
  )?.path;
}

function buildQuestions(
  mode: Mode,
  scope: Scope,
  recommendation: ModeRecommendation,
  decisions: readonly AcceptedDecision[],
  context: DetectedContext,
  artifacts: readonly ArtifactRecord[]
): ProjectQuestion[] {
  if (mode === "audit") return [];
  const decided = new Set(decisions.map((decision) => decision.id));
  const questions: ProjectQuestion[] = [];
  const add = (
    id: string,
    question: string,
    contextText: string,
    reason: string,
    recommendedDefault?: ProjectQuestion["recommendedDefault"],
    questionEvidence: Evidence[] = [evidence("repository analysis")]
  ): void => {
    questions.push({
      id,
      question,
      context: contextText,
      reason,
      ...(recommendedDefault === undefined ? {} : { recommendedDefault }),
      evidence: questionEvidence,
      requiredForApproval: true
    });
  };

  if (mode === "new") {
    if (!decided.has("project.outcome") && context.inferredOutcome === undefined) {
      add(
        "project.outcome",
        "What outcome should this repository produce?",
        "No confirmed product outcome was found.",
        "The outcome determines which foundation artifacts are justified."
      );
    }
    if (
      scopeIncludes(scope, "engineering") &&
      context.technologies.length === 0 &&
      !decided.has("project.technologies")
    ) {
      add(
        "project.technologies",
        "Which implementation technologies should this repository use?",
        "No technology could be inferred from manifests or source files.",
        "The answer determines the engineering foundation and manifest target."
      );
    }
    if (
      scopeIncludes(scope, "ai") &&
      context.aiTools.length === 0 &&
      !decided.has("project.aiTools")
    ) {
      add(
        "project.aiTools",
        "Which AI coding tools should the repository support?",
        "No supported developer-AI tool configuration was detected.",
        "Tool selection determines whether native AI instructions are justified."
      );
    }
    if (!decided.has("project.constraints") && context.constraintEvidence.length > 0) {
      add(
        "project.constraints",
        "Which documented constraints must the foundation preserve?",
        `Detected constraint context: ${context.constraintEvidence
          .map((item) => `${item.source}: ${item.detail ?? "documented constraint"}`)
          .join(", ")}.`,
        "The answer can change architecture, compatibility, preservation, or verification decisions.",
        [],
        context.constraintEvidence
      );
    }
    if (!decided.has("project.risks") && context.riskEvidence.length > 0) {
      add(
        "project.risks",
        "Which detected risks must verification or safety behavior address?",
        `Detected risk context: ${context.riskEvidence
          .map((item) => `${item.source}: ${item.detail ?? "documented risk"}`)
          .join(", ")}.`,
        "The answer can change preservation, verification, and safety behavior.",
        [],
        context.riskEvidence
      );
    }
  }
  if (recommendation.confidence === "low" && !decided.has("project.mode")) {
    questions.push({
      id: "project.mode",
      question: "Should this repository be treated as new or established?",
      context: recommendation.uncertainty ?? "Repository establishment evidence is mixed.",
      reason: "The mode changes preservation and proposal behavior.",
      recommendedDefault: recommendation.recommendedMode,
      evidence:
        recommendation.signals.flatMap((signal) => signal.evidence).slice(0, 5).length > 0
          ? recommendation.signals.flatMap((signal) => signal.evidence).slice(0, 5)
          : [evidence("repository analysis")],
      requiredForApproval: true
    });
  }
  if (
    scopeIncludes(scope, "engineering") &&
    inferredManifestPath(artifacts, context, decisions) === undefined &&
    decided.has("project.technologies") &&
    !decided.has("project.manifestPath")
  ) {
    add(
      "project.manifestPath",
      "Which repository-relative manifest path should own engineering commands?",
      "The selected technology does not have an unambiguous conventional manifest path.",
      "A concrete safe target is required before an engineering proposal can be approved."
    );
  }
  return questions.sort((left, right) => compareCanonicalText(left.id, right.id));
}

function isAdequateExistingTarget(
  targetPath: string,
  text: string | undefined,
  context: DetectedContext
): boolean {
  if (text === undefined) return false;
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact === "" || /^(?:#\s*)?(?:todo|placeholder|project|readme)$/i.test(compact)) {
    return false;
  }
  const basename = path.posix.basename(targetPath).toLowerCase();
  if (/^readme(?:\.|$)/.test(basename)) return meaningfulSource(text);
  if (/^agents(?:\.override)?\.md$/.test(basename)) {
    const instructionText = text.replace(/^#{1,6}\s+.*$/gm, "").trim();
    return instructionText.length >= 20;
  }
  const authority = context.manifests.find((manifest) => manifest.path === targetPath);
  if (authority !== undefined) {
    const valid =
      authority.kind === "package-json" ||
      (authority.kind === "python" && /^\s*\[(?:project|tool\.poetry)]/m.test(text)) ||
      (authority.kind === "cargo" && /^\s*\[(?:package|workspace)]/m.test(text)) ||
      (authority.kind === "go" && /^\s*module\s+\S+/m.test(text)) ||
      (authority.kind === "maven" && /<project(?:\s|>)/i.test(text));
    return (
      valid &&
      [...authority.scripts, ...authority.standardCommands].some((command) =>
        VERIFICATION_COMMAND_NAMES.has(command)
      )
    );
  }
  if (["pyproject.toml", "cargo.toml", "go.mod", "pom.xml"].includes(basename)) return false;
  return compact.length >= 20;
}

function planChanges(
  mode: ProposalMode,
  scope: Scope,
  artifacts: readonly ArtifactRecord[],
  texts: ReadonlyMap<string, string>,
  findings: readonly Finding[],
  decisions: readonly AcceptedDecision[],
  context: DetectedContext
): { changes: PlannedFileChange[]; preservedPaths: string[] } {
  const artifactByPath = new Map(artifacts.map((artifact) => [artifact.path, artifact]));
  const paths = new Set(artifactByPath.keys());
  const changes = new Map<string, PlannedFileChange>();
  const actionPriority: Record<PlannedFileChange["action"], number> = {
    skip: 0,
    create: 1,
    update: 2,
    conflict: 3
  };
  const addChange = (candidate: PlannedFileChange): void => {
    const existing = changes.get(candidate.path);
    if (existing === undefined) {
      changes.set(candidate.path, candidate);
      return;
    }
    const dominant =
      actionPriority[candidate.action] > actionPriority[existing.action] ? candidate : existing;
    changes.set(candidate.path, {
      ...dominant,
      purpose: [...new Set([existing.purpose, candidate.purpose])].join("; "),
      reason: [...new Set([existing.reason, candidate.reason])].join("; "),
      dependencies: [...new Set([...existing.dependencies, ...candidate.dependencies])].sort(
        compareCanonicalText
      ),
      validationExpectations: [
        ...new Set([...existing.validationExpectations, ...candidate.validationExpectations])
      ]
    });
  };
  const baseChange = (
    targetPath: string,
    purpose: string,
    reason: string,
    dependencies: string[]
  ): PlannedFileChange => {
    const existing = artifactByPath.get(targetPath);
    return {
      path: targetPath,
      action:
        existing === undefined
          ? "create"
          : isAdequateExistingTarget(targetPath, texts.get(targetPath), context)
            ? "skip"
            : "update",
      purpose,
      reason,
      origin: existing?.origin ?? "devcharter",
      ownership: existing?.ownership ?? "project",
      dependencies,
      maintenanceImplication:
        "Keep the authoritative project-owned file synchronized with repository behavior",
      validationExpectations: [
        "Referenced paths and commands resolve",
        "The file remains project-owned"
      ]
    };
  };

  if (scopeIncludes(scope, "governance")) {
    const governancePath =
      (paths.has("README.md") ? "README.md" : undefined) ??
      (mode === "retrofit" && paths.has("MANIFEST.md") ? "MANIFEST.md" : undefined) ??
      (mode === "retrofit"
        ? artifacts.find((artifact) => /^(docs|specs)\/.*\.md$/i.test(artifact.path))?.path
        : undefined) ??
      "README.md";
    addChange(
      baseChange(
        governancePath,
        "Provide the primary current project context",
        paths.has(governancePath)
          ? `${governancePath} exists and remains the primary project-context candidate`
          : "No primary project-context document exists for the selected governance scope",
        ["confirmed project outcome", "accepted constraints and risks"]
      )
    );
  }
  const manifestPath = scopeIncludes(scope, "engineering")
    ? inferredManifestPath(artifacts, context, decisions)
    : undefined;
  if (manifestPath !== undefined) {
    addChange(
      baseChange(
        manifestPath,
        "Provide the authoritative engineering commands and project manifest",
        paths.has(manifestPath)
          ? `${manifestPath} exists and is the applicable engineering authority`
          : `The accepted or inferred technology uses ${manifestPath} as its conventional manifest`,
        ["accepted or inferred technologies", "verification requirements"]
      )
    );
  }
  if (scopeIncludes(scope, "ai")) {
    addChange(
      baseChange(
        "AGENTS.md",
        "Provide concise native repository instructions for selected AI coding tools",
        paths.has("AGENTS.md")
          ? "The root Codex instruction file exists and should be preserved when adequate"
          : "No root AI instruction file exists and the selected scope includes AI",
        ["confirmed project outcome", "accepted or inferred AI tools"]
      )
    );
  }

  const targetPathsForFinding = (item: Finding): string[] => {
    if (item.code === "MISSING_VERIFICATION") {
      return manifestPath === undefined ? [] : [manifestPath];
    }
    if (item.code === "MISSING_CRITICAL_JOURNEY_EVIDENCE") {
      if (paths.has("README.md")) return ["README.md"];
      return manifestPath === undefined ? [] : [manifestPath];
    }
    return item.evidence.map((entry) => entry.source).filter((source) => paths.has(source));
  };
  for (const item of findings) {
    for (const targetPath of targetPathsForFinding(item)) {
      const existing = artifactByPath.get(targetPath);
      const action: PlannedFileChange["action"] = isConflictFinding(item)
        ? "conflict"
        : existing === undefined
          ? "create"
          : "update";
      addChange({
        path: targetPath,
        action,
        purpose: item.summary,
        reason: item.recommendedAction,
        origin: existing?.origin ?? "devcharter",
        ownership: existing?.ownership ?? "project",
        dependencies: item.evidence.map((entry) => entry.source),
        maintenanceImplication:
          action === "conflict"
            ? "Ownership or authority must be resolved before any later application"
            : "The authoritative source must remain synchronized with its consumers",
        validationExpectations: ["The reported finding no longer reproduces"]
      });
    }
  }

  if (mode === "retrofit") {
    for (const artifact of artifacts.filter((item) => /^\.ai\/[^/]+\.ya?ml$/i.test(item.path))) {
      addChange({
        path: artifact.path,
        action: "conflict",
        purpose: "Resolve legacy AI configuration through an explicit migration decision",
        reason: "Legacy .ai YAML cannot be consolidated or removed safely without approval",
        origin: "unknown",
        ownership: "unknown",
        dependencies: ["accepted migration decision"],
        maintenanceImplication: "The legacy file remains project-owned until migration is approved",
        validationExpectations: ["No legacy file is deleted or rewritten automatically"]
      });
    }
  }

  const preservedPaths = artifacts
    .filter((artifact) => artifact.origin === "project")
    .map((artifact) => artifact.path)
    .sort(compareCanonicalText);
  return {
    changes: [...changes.values()].sort((left, right) =>
      compareCanonicalText(left.path, right.path)
    ),
    preservedPaths
  };
}

function normalizeIdentityValue(value: JsonValue): JsonValue {
  if (typeof value === "string") return value.replace(/\r\n?/g, "\n");
  if (Array.isArray(value)) return value.map(normalizeIdentityValue);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, normalizeIdentityValue(child)])
  );
}

function normalizedProposalIdentity(proposal: EcosystemProposal): JsonValue {
  const normalizeEvidence = (items: readonly { source: string; detail?: string }[]) =>
    [...items].sort((left, right) =>
      compareCanonicalText(
        `${left.source}:${left.detail ?? ""}`,
        `${right.source}:${right.detail ?? ""}`
      )
    );
  const plannedChanges = proposal.plannedChanges
    .map((change) => ({
      ...change,
      path: normalizePath(change.path),
      dependencies: [...new Set(change.dependencies)].sort(compareCanonicalText),
      validationExpectations: [...change.validationExpectations]
    }))
    .sort((left, right) =>
      compareCanonicalText(`${left.path}:${left.action}`, `${right.path}:${right.action}`)
    );
  return normalizeIdentityValue({
    mode: proposal.mode,
    scope: proposal.scope,
    desiredOutcome: proposal.desiredOutcome,
    facts: [...proposal.facts]
      .map((fact) => ({ ...fact, evidence: normalizeEvidence(fact.evidence) }))
      .sort((left, right) => compareCanonicalText(left.key, right.key)),
    findings: [...proposal.findings]
      .map((item) => ({ ...item, evidence: normalizeEvidence(item.evidence) }))
      .sort((left, right) => compareCanonicalText(left.code, right.code)),
    conflicts: [...proposal.conflicts]
      .map((item) => ({ ...item, evidence: normalizeEvidence(item.evidence) }))
      .sort((left, right) => compareCanonicalText(left.code, right.code)),
    assumptions: [...proposal.assumptions]
      .map((item) => ({
        ...item,
        ...(item.evidence === undefined ? {} : { evidence: normalizeEvidence(item.evidence) })
      }))
      .sort((left, right) => compareCanonicalText(left.summary, right.summary)),
    acceptedDecisions: [...proposal.acceptedDecisions]
      .map((item) => ({
        ...item,
        ...(item.evidence === undefined ? {} : { evidence: normalizeEvidence(item.evidence) })
      }))
      .sort((left, right) => compareCanonicalText(left.id, right.id)),
    questions: [...proposal.questions]
      .map((item) => ({ ...item, evidence: normalizeEvidence(item.evidence) }))
      .sort((left, right) => compareCanonicalText(left.id, right.id)),
    criticalJourneys: [...proposal.criticalJourneys]
      .map((item) => ({ ...item, evidence: normalizeEvidence(item.evidence) }))
      .sort((left, right) => compareCanonicalText(left.id, right.id)),
    consideredComponents: [...proposal.consideredComponents].sort((left, right) =>
      compareCanonicalText(left.component, right.component)
    ),
    plannedChanges,
    preservedPaths: [...new Set(proposal.preservedPaths.map(normalizePath))].sort(
      compareCanonicalText
    ),
    risks: [...proposal.risks].sort(compareCanonicalText),
    validation: [...proposal.validation],
    deferredWork: [...proposal.deferredWork].sort(compareCanonicalText)
  });
}

export function computeProposalFingerprint(proposal: EcosystemProposal): string {
  return stableHash(normalizedProposalIdentity(proposal));
}

function validateProposalApproval(
  proposal: EcosystemProposal,
  approval: ProposalApproval,
  currentRepositoryFingerprint: string
): Result<EcosystemProposal> {
  const parsedApproval = proposalApprovalSchema.safeParse(approval);
  if (!parsedApproval.success) {
    return failure(
      new DevCharterError("APPROVAL_REQUIRED", "Explicit valid proposal approval is required")
    );
  }
  if (proposal.questions.some((question) => question.requiredForApproval)) {
    return failure(
      new DevCharterError("APPROVAL_REQUIRED", "Required proposal questions remain unresolved")
    );
  }
  if (proposal.plannedChanges.length === 0) {
    return failure(
      new DevCharterError("APPROVAL_REQUIRED", "An actionable proposal decision is required")
    );
  }
  const proposalFingerprint = computeProposalFingerprint(proposal);
  if (
    proposal.proposalFingerprint !== proposalFingerprint ||
    approval.proposalFingerprint !== proposalFingerprint ||
    approval.proposalRevision !== proposal.revision ||
    approval.repositoryFingerprint !== proposal.repositoryFingerprint ||
    currentRepositoryFingerprint !== proposal.repositoryFingerprint
  ) {
    return failure(
      new DevCharterError(
        "STALE_PROPOSAL",
        "Proposal approval does not match current proposal state"
      )
    );
  }
  return success({ ...proposal, approved: true });
}

export async function approveProposal(
  root: string,
  proposal: EcosystemProposal,
  approval: ProposalApproval,
  options: ProjectArchitectOptions = {}
): Promise<Result<EcosystemProposal>> {
  if ((proposal as { mode?: unknown }).mode === "audit") {
    return failure(new DevCharterError("INVALID_ARGUMENT", "Audit does not accept proposals"));
  }
  const parsedProposal = ecosystemProposalSchema.safeParse(proposal);
  if (!parsedProposal.success) {
    return failure(
      new DevCharterError("INVALID_ARGUMENT", "Proposal does not match the canonical contract")
    );
  }
  const reader = await RepositoryReader.create(root);
  if (!reader.ok) return reader;
  const fingerprint = await buildFingerprint(
    reader.value,
    parsedProposal.data.scope,
    options.gitRunner ?? executeGit
  );
  if (!fingerprint.ok) return fingerprint;
  return validateProposalApproval(
    parsedProposal.data,
    approval,
    fingerprint.value.repositoryFingerprint
  );
}

function buildAssumptions(
  fingerprint: FingerprintBuild,
  mode: Mode,
  decisions: readonly AcceptedDecision[],
  context: DetectedContext
): ProposalAssumption[] {
  const uncertain = fingerprint.inputs.excludedPaths.filter(
    (item) => item.uncertainty !== undefined
  );
  const assumptions: ProposalAssumption[] = [];
  if (uncertain.length > 0 || fingerprint.skillProvenanceUncertainties.length > 0) {
    assumptions.push({
      summary: "Excluded or uncertain repository material does not change the scoped conclusions",
      evidence: uncertain
        .slice(0, 10)
        .map((item) => evidence(item.path, item.uncertainty))
        .concat(fingerprint.skillProvenanceUncertainties.slice(0, 10))
    });
  }
  if (mode === "new") {
    const decided = new Set(decisions.map((decision) => decision.id));
    if (!decided.has("project.constraints") && context.constraintEvidence.length === 0) {
      assumptions.push({
        summary: "No special project constraints are assumed beyond discovered repository evidence",
        evidence: [evidence("repository analysis", "No material constraint signal was detected")]
      });
    }
    if (!decided.has("project.risks") && context.riskEvidence.length === 0) {
      assumptions.push({
        summary: "No special project risks are assumed beyond ordinary safe-change behavior",
        evidence: [evidence("repository analysis", "No material risk signal was detected")]
      });
    }
  }
  return assumptions;
}

function journeyId(prefix: string, value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${prefix}-${normalized || "workflow"}`;
}

function buildCriticalJourneys(
  artifacts: readonly ArtifactRecord[],
  texts: ReadonlyMap<string, string>,
  context: DetectedContext,
  scope: Scope
): CriticalJourney[] {
  const journeys = new Map<string, CriticalJourney>();
  const verificationPriority = [
    "verify",
    "test",
    "pytest",
    "check",
    "ruff",
    "mypy",
    "clippy",
    "vet",
    "build",
    "lint",
    "typecheck"
  ];
  const ciPaths = (scopeIncludes(scope, "engineering") ? artifacts : [])
    .map((artifact) => artifact.path)
    .filter((repositoryPath) =>
      /(^\.github\/workflows\/.*\.ya?ml$)|((^|\/)\.gitlab-ci\.ya?ml$)/i.test(repositoryPath)
    )
    .sort(compareCanonicalText);

  const engineeringManifests = scopeIncludes(scope, "engineering") ? context.manifests : [];
  const rootManifest = engineeringManifests.find((manifest) => manifest.directory === "");
  const rootCommands =
    rootManifest === undefined
      ? new Set<string>()
      : new Set([...rootManifest.scripts, ...rootManifest.standardCommands]);
  const aggregateCommand = ["verify", "check"].find((candidate) => rootCommands.has(candidate));
  if (rootManifest !== undefined && aggregateCommand !== undefined) {
    const id = journeyId("developer", `${rootManifest.path}-${aggregateCommand}`);
    journeys.set(id, {
      id,
      summary: `Run the aggregate ${aggregateCommand} workflow declared by ${rootManifest.path}`,
      evidence: [evidence(rootManifest.path, "Repository-root aggregate verification authority")],
      verification: `Execute the repository-native ${aggregateCommand} command and confirm its result`
    });
  } else if (ciPaths.length > 0) {
    journeys.set("developer-ci-verification", {
      id: "developer-ci-verification",
      summary: "Run the repository's configured continuous verification workflow",
      evidence: ciPaths.slice(0, 5).map((source) => evidence(source)),
      verification: "Execute the configured CI workflow or its repository-native local equivalent"
    });
  } else if (rootManifest !== undefined) {
    const command = verificationPriority.find((candidate) => rootCommands.has(candidate));
    if (command !== undefined) {
      const id = journeyId("developer", `${rootManifest.path}-${command}`);
      journeys.set(id, {
        id,
        summary: `Run the ${command} workflow declared or supported by ${rootManifest.path}`,
        evidence: [evidence(rootManifest.path, "Repository-root verification authority")],
        verification: `Execute the repository-native ${command} command and confirm its result`
      });
    }
  } else {
    for (const manifest of engineeringManifests.slice(0, 3)) {
      const available = new Set([...manifest.scripts, ...manifest.standardCommands]);
      const command = verificationPriority
        .filter((candidate) => candidate !== "build")
        .find((candidate) => available.has(candidate));
      if (command === undefined) continue;
      const id = journeyId("developer", `${manifest.path}-${command}`);
      journeys.set(id, {
        id,
        summary: `Run the independently maintained ${command} workflow in ${manifest.directory}`,
        evidence: [evidence(manifest.path, "Package-level verification authority")],
        verification: `Execute the package-native ${command} command and confirm its result`
      });
    }
  }

  for (const [repositoryPath, text] of texts) {
    if (!scopeIncludes(scope, "governance") || !isCurrentDocumentationPath(repositoryPath)) {
      continue;
    }
    for (const match of text.matchAll(
      /^#{1,6}\s+(?:(?:critical|user)\s+)?(?:journey|user flow)s?\s*(?:[-:â€”]\s*)?(.+)?$/gim
    )) {
      const title = match[1]?.trim();
      const summary = title === undefined || title === "" ? "Documented user journey" : title;
      const id = journeyId("user", `${repositoryPath}-${summary}`);
      journeys.set(id, {
        id,
        summary,
        evidence: [evidence(repositoryPath, "Explicit user-journey heading")],
        verification: "Exercise the documented journey end to end"
      });
    }
  }

  for (const artifact of scopeIncludes(scope, "engineering") ? artifacts : []) {
    if (!/(^|\/)(?:e2e|playwright|cypress)(\/|$)|\.e2e\./i.test(artifact.path)) continue;
    const text = texts.get(artifact.path);
    const title = text?.match(/\b(?:test|it)\s*\(\s*["'`]([^"'`]+)["'`]/)?.[1];
    if (title === undefined) continue;
    const id = journeyId("user", `${artifact.path}-${title}`);
    journeys.set(id, {
      id,
      summary: title,
      evidence: [evidence(artifact.path, "Explicit E2E test title")],
      verification: `Run the E2E test in ${artifact.path}`
    });
  }

  return [...journeys.values()]
    .sort((left, right) => compareCanonicalText(left.id, right.id))
    .slice(0, 12);
}

function buildConsideredComponents(findings: readonly Finding[]): ConsideredComponent[] {
  const components: ConsideredComponent[] = [];
  if (findings.some((finding) => finding.code.startsWith("CI_"))) {
    components.push({
      component: "CI workflow changes",
      decision: "defer",
      reason: "Repository CI evidence is inconsistent; this read-only proposal records the gap"
    });
  }
  if (
    findings.some((finding) =>
      ["UNJUSTIFIED_AI_COMPLEXITY", "DUPLICATE_AI_MATERIAL"].includes(finding.code)
    )
  ) {
    components.push({
      component: "Additional AI scaffolding",
      decision: "reject",
      reason: "Existing AI material is already duplicated or insufficiently routed"
    });
  }
  return components;
}

function buildRisks(
  fingerprint: FingerprintBuild,
  decisions: readonly AcceptedDecision[]
): string[] {
  const risks = [...(decisionValue<string[]>(decisions, "project.risks") ?? [])];
  if (fingerprint.inputs.excludedPaths.some((item) => item.uncertainty !== undefined)) {
    risks.push("Excluded or uncertain repository material may affect conclusions");
  }
  return [...new Set(risks)].sort(compareCanonicalText);
}

function createProposal(
  mode: ProposalMode,
  scope: Scope,
  fingerprint: FingerprintBuild,
  facts: ProjectFact[],
  findings: Finding[],
  questions: ProjectQuestion[],
  decisions: AcceptedDecision[],
  context: DetectedContext,
  criticalJourneys: CriticalJourney[],
  previousProposal?: EcosystemProposal
): EcosystemProposal {
  const { changes, preservedPaths } = planChanges(
    mode,
    scope,
    fingerprint.artifacts,
    fingerprint.texts,
    findings,
    decisions,
    context
  );
  const desiredOutcomeDecision = decisions.find((decision) => decision.id === "project.outcome");
  const assumptions = buildAssumptions(fingerprint, mode, decisions, context);
  const conflicts = findings.filter(isConflictFinding);
  const consideredComponents = buildConsideredComponents(findings);
  const risks = buildRisks(fingerprint, decisions);
  const draft: EcosystemProposal = {
    mode,
    scope,
    repositoryFingerprint: fingerprint.repositoryFingerprint,
    proposalFingerprint: "pending",
    revision: previousProposal?.revision ?? 1,
    approved: false,
    facts,
    assumptions,
    acceptedDecisions: decisions,
    questions,
    findings,
    conflicts,
    desiredOutcome:
      typeof desiredOutcomeDecision?.value === "string"
        ? desiredOutcomeDecision.value
        : context.inferredOutcome?.value !== undefined
          ? context.inferredOutcome.value
          : mode === "new"
            ? "Establish the minimum repository-specific AI development foundation"
            : "Improve the existing AI development ecosystem without replacing useful content",
    criticalJourneys,
    consideredComponents,
    plannedChanges: changes,
    preservedPaths,
    risks,
    validation: [
      "Re-run scoped discovery before rendering or application",
      "Validate all referenced paths and commands"
    ],
    deferredWork: ["Render and apply approved changes in SPEC-0001D"]
  };
  const proposalFingerprint = computeProposalFingerprint(draft);
  const revision =
    previousProposal !== undefined && previousProposal.proposalFingerprint !== proposalFingerprint
      ? previousProposal.revision + 1
      : draft.revision;
  return ecosystemProposalSchema.parse({ ...draft, revision, proposalFingerprint });
}

export async function runProjectArchitect(
  root: string,
  request: ProjectArchitectRequest,
  options: ProjectArchitectOptions = {}
): Promise<Result<ProjectArchitectResult>> {
  const parsedMode = modeSchema.safeParse(request.mode);
  const parsedScope = scopeSchema.safeParse(request.scope ?? "full");
  const parsedDecisions = (request.acceptedDecisions ?? []).map((decision) =>
    acceptedDecisionSchema.safeParse(decision)
  );
  const parsedPrevious =
    request.previousProposal === undefined
      ? undefined
      : ecosystemProposalSchema.safeParse(request.previousProposal);
  if (
    !parsedMode.success ||
    !parsedScope.success ||
    parsedDecisions.some((decision) => !decision.success) ||
    parsedPrevious?.success === false
  ) {
    return failure(new DevCharterError("INVALID_ARGUMENT", "Project Architect request is invalid"));
  }
  const acceptedDecisions = parsedDecisions
    .filter((decision): decision is { success: true; data: AcceptedDecision } => decision.success)
    .map((decision) => decision.data)
    .sort((left, right) => compareCanonicalText(left.id, right.id));
  const decisionError = validateDecisionSet(acceptedDecisions);
  if (decisionError !== undefined) {
    return failure(new DevCharterError("INVALID_ARGUMENT", decisionError));
  }
  if (
    parsedPrevious?.success === true &&
    (parsedPrevious.data.mode !== parsedMode.data || parsedPrevious.data.scope !== parsedScope.data)
  ) {
    return failure(
      new DevCharterError(
        "INVALID_ARGUMENT",
        "Previous proposal mode and scope must match the current request"
      )
    );
  }
  const mode = parsedMode.data;
  const scope = parsedScope.data;
  const selectedMode = decisionValue<ProposalMode>(acceptedDecisions, "project.mode");
  if (mode !== "audit" && selectedMode !== undefined && selectedMode !== mode) {
    return failure(
      new DevCharterError(
        "INVALID_ARGUMENT",
        "project.mode must match the requested new or retrofit workflow"
      )
    );
  }
  const reader = await RepositoryReader.create(root);
  if (!reader.ok) return reader;
  const fingerprint = await buildFingerprint(reader.value, scope, options.gitRunner ?? executeGit);
  if (!fingerprint.ok) return fingerprint;

  const recommendation = recommendMode(
    fingerprint.value.artifacts,
    fingerprint.value.texts,
    fingerprint.value.inputs.gitFacts
  );
  const detectedContext = detectContext(fingerprint.value.artifacts, fingerprint.value.texts);
  const criticalJourneys = buildCriticalJourneys(
    fingerprint.value.artifacts,
    fingerprint.value.texts,
    detectedContext,
    scope
  );
  const findings = analyzeFindings(
    fingerprint.value.artifacts,
    fingerprint.value.texts,
    scope,
    recommendation,
    detectedContext,
    criticalJourneys
  );
  fingerprint.value.semanticallyInspectedPaths = collectSemanticallyAnalyzedPaths(
    fingerprint.value,
    scope,
    detectedContext,
    findings
  );
  const facts = buildFacts(fingerprint.value, recommendation, scope, detectedContext);
  const questions = buildQuestions(
    mode,
    scope,
    recommendation,
    acceptedDecisions,
    detectedContext,
    fingerprint.value.artifacts
  );
  const validation = [
    "Repository and Git state remain unchanged",
    "Fingerprint inputs are reproducible"
  ];
  const deferredWork = ["Rendering and application are deferred to SPEC-0001D"];
  const assumptions = buildAssumptions(fingerprint.value, mode, acceptedDecisions, detectedContext);
  const consideredComponents = buildConsideredComponents(findings);
  const conflicts = findings.filter(isConflictFinding);
  const risks = buildRisks(fingerprint.value, acceptedDecisions);
  const preservedPaths = fingerprint.value.artifacts
    .filter((artifact) => artifact.origin === "project")
    .map((artifact) => artifact.path)
    .sort(compareCanonicalText);

  if (mode === "audit") {
    return success({
      mode,
      scope,
      summary: `Read-only ${scope} audit completed with ${findings.length} finding(s)`,
      recommendation,
      artifacts: fingerprint.value.artifacts,
      semanticallyInspectedPaths: fingerprint.value.semanticallyInspectedPaths,
      fingerprintInputs: fingerprint.value.inputs,
      repositoryFingerprint: fingerprint.value.repositoryFingerprint,
      facts,
      findings,
      assumptions,
      questions: [],
      criticalJourneys,
      consideredComponents,
      plannedChanges: [],
      preservedPaths,
      conflicts,
      risks,
      appliedChanges: [],
      validation,
      deferredWork
    });
  }

  const proposal = createProposal(
    mode,
    scope,
    fingerprint.value,
    facts,
    findings,
    questions,
    acceptedDecisions,
    detectedContext,
    criticalJourneys,
    parsedPrevious?.success === true ? parsedPrevious.data : undefined
  );
  return success({
    mode,
    scope,
    summary: `${mode} analysis produced unapproved proposal revision ${proposal.revision}`,
    recommendation,
    artifacts: fingerprint.value.artifacts,
    semanticallyInspectedPaths: fingerprint.value.semanticallyInspectedPaths,
    fingerprintInputs: fingerprint.value.inputs,
    repositoryFingerprint: fingerprint.value.repositoryFingerprint,
    facts: proposal.facts,
    findings: proposal.findings,
    assumptions: proposal.assumptions,
    questions: proposal.questions,
    criticalJourneys: proposal.criticalJourneys,
    consideredComponents: proposal.consideredComponents,
    plannedChanges: proposal.plannedChanges,
    preservedPaths: proposal.preservedPaths,
    conflicts: proposal.conflicts,
    risks: proposal.risks,
    proposal,
    appliedChanges: [],
    validation: proposal.validation,
    deferredWork: proposal.deferredWork
  });
}
