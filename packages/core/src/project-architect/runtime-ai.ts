import path from "node:path";

import { compareCanonicalText, stableHash } from "../serialization.js";

export interface AiDependency {
  name: string;
  manifestPath: string;
  manifestDirectory: string;
  ecosystem: RuntimeAiEcosystem;
}

export type RuntimeAiEcosystem = "javascript" | "python" | "rust" | "go" | "jvm";

interface RuntimeAiManifest {
  path: string;
  directory: string;
  ecosystem: RuntimeAiEcosystem;
  dependencies: readonly string[];
}

export interface RuntimeAiEvidence {
  dependencies: AiDependency[];
  matchedDependencies: AiDependency[];
  unmatchedDependencies: AiDependency[];
  matchedImportsBySource: ReadonlyMap<string, readonly string[]>;
  dependenciesByManifest: ReadonlyMap<string, readonly string[]>;
}

function normalizeIdentifier(value: string): string {
  return value.trim().replace(/\\/g, "/").toLowerCase();
}

function normalizeRepositoryPath(value: string): string {
  const normalized = path.posix.normalize(value.replace(/\\/g, "/"));
  return normalized === "." ? "" : normalized.replace(/^\.\//, "");
}

function manifestEcosystem(repositoryPath: string): RuntimeAiEcosystem | undefined {
  switch (path.posix.basename(repositoryPath).toLowerCase()) {
    case "package.json":
      return "javascript";
    case "pyproject.toml":
      return "python";
    case "cargo.toml":
      return "rust";
    case "go.mod":
      return "go";
    case "pom.xml":
      return "jvm";
    default:
      return undefined;
  }
}

function sourceEcosystem(repositoryPath: string): RuntimeAiEcosystem | undefined {
  if (/\.[cm]?[jt]sx?$/i.test(repositoryPath)) return "javascript";
  if (/\.py$/i.test(repositoryPath)) return "python";
  if (/\.rs$/i.test(repositoryPath)) return "rust";
  if (/\.go$/i.test(repositoryPath)) return "go";
  if (/\.(?:java|kt|kts)$/i.test(repositoryPath)) return "jvm";
  return undefined;
}

function isAiDependencyName(value: string): boolean {
  return /openai|anthropic|langchain|langgraph|llama[-_.]?index|ollama|semantic[-_.]?kernel|ai-sdk|spring[-_.]?ai/i.test(
    value
  );
}

function dependencyName(value: string): string | undefined {
  return value.trim().match(/^([@A-Za-z0-9][@A-Za-z0-9_./-]*)/)?.[1];
}

function readPythonDependencies(text: string): string[] {
  const dependencies = new Set<string>();
  for (const match of text
    .replace(/\r\n?/g, "\n")
    .matchAll(/(?:^|\n)\s*(?:dependencies|[A-Za-z0-9_-]+)\s*=\s*\[([\s\S]*?)]/g)) {
    for (const quoted of (match[1] ?? "").matchAll(/["']([^"']+)["']/g)) {
      const name = dependencyName(quoted[1] ?? "");
      if (name !== undefined && isAiDependencyName(name))
        dependencies.add(normalizeIdentifier(name));
    }
  }
  const poetry = text
    .replace(/\r\n?/g, "\n")
    .match(/(?:^|\n)\s*\[tool\.poetry\.dependencies]\s*\n([\s\S]*?)(?=\n\s*\[|$)/i)?.[1];
  if (poetry !== undefined) {
    for (const line of poetry.split("\n")) {
      const name = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=/)?.[1];
      if (name !== undefined && isAiDependencyName(name))
        dependencies.add(normalizeIdentifier(name));
    }
  }
  return [...dependencies].sort(compareCanonicalText);
}

function readCargoDependencies(text: string): string[] {
  const dependencies = new Set<string>();
  let dependencySection = false;
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    const section = line.match(/^\s*\[([^\]]+)]\s*(?:#.*)?$/)?.[1]?.toLowerCase();
    if (section !== undefined) {
      dependencySection = /(?:^|\.)dev-dependencies$|(?:^|\.)dependencies$/.test(section);
      continue;
    }
    if (!dependencySection || /^\s*(?:#|$)/.test(line)) continue;
    const name = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=/)?.[1];
    if (name !== undefined && isAiDependencyName(name)) dependencies.add(normalizeIdentifier(name));
  }
  return [...dependencies].sort(compareCanonicalText);
}

function readGoDependencies(text: string): string[] {
  const dependencies = new Set<string>();
  let requireBlock = false;
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    if (/^\s*require\s*\(\s*$/.test(line)) {
      requireBlock = true;
      continue;
    }
    if (requireBlock && /^\s*\)\s*$/.test(line)) {
      requireBlock = false;
      continue;
    }
    const value = requireBlock
      ? line.match(/^\s*([^\s/][^\s]*)\s+v\S+/)?.[1]
      : line.match(/^\s*require\s+([^\s]+)\s+v\S+/)?.[1];
    if (value !== undefined && isAiDependencyName(value))
      dependencies.add(normalizeIdentifier(value));
  }
  return [...dependencies].sort(compareCanonicalText);
}

function readMavenDependencies(text: string): string[] {
  const dependencies = new Set<string>();
  for (const match of text
    .replace(/\r\n?/g, "\n")
    .matchAll(/<dependency>([\s\S]*?)<\/dependency>/gi)) {
    const block = match[1] ?? "";
    const group = block.match(/<groupId>\s*([^<\s]+)\s*<\/groupId>/i)?.[1];
    const artifact = block.match(/<artifactId>\s*([^<\s]+)\s*<\/artifactId>/i)?.[1];
    const name = [group, artifact]
      .filter((value): value is string => value !== undefined)
      .join(":");
    if (name !== "" && isAiDependencyName(name)) dependencies.add(normalizeIdentifier(name));
  }
  return [...dependencies].sort(compareCanonicalText);
}

function readRuntimeAiManifests(texts: ReadonlyMap<string, string>): RuntimeAiManifest[] {
  const manifests = new Map<string, RuntimeAiManifest>();
  for (const [rawPath, rawText] of texts) {
    const repositoryPath = normalizeRepositoryPath(rawPath);
    const ecosystem = manifestEcosystem(repositoryPath);
    if (ecosystem === undefined) continue;
    const text = rawText.replace(/\r\n?/g, "\n");
    const basename = path.posix.basename(repositoryPath).toLowerCase();
    let names: string[] = [];
    if (basename === "package.json") {
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        names = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]
          .flatMap((field) => {
            const value = parsed[field];
            return value !== null && typeof value === "object" && !Array.isArray(value)
              ? Object.keys(value as Record<string, unknown>)
              : [];
          })
          .filter(isAiDependencyName)
          .map(normalizeIdentifier);
      } catch {
        names = [];
      }
    } else if (basename === "pyproject.toml") {
      names = readPythonDependencies(text);
    } else if (basename === "cargo.toml") {
      names = readCargoDependencies(text);
    } else if (basename === "go.mod") {
      names = readGoDependencies(text);
    } else if (basename === "pom.xml") {
      names = readMavenDependencies(text);
    }
    manifests.set(`${ecosystem}\0${repositoryPath}`, {
      path: repositoryPath,
      directory:
        path.posix.dirname(repositoryPath) === "." ? "" : path.posix.dirname(repositoryPath),
      ecosystem,
      dependencies: [...new Set(names)].sort(compareCanonicalText)
    });
  }
  return [...manifests.values()].sort((left, right) =>
    compareCanonicalText(`${left.ecosystem}\0${left.path}`, `${right.ecosystem}\0${right.path}`)
  );
}

export function readAiDependencies(texts: ReadonlyMap<string, string>): AiDependency[] {
  return readRuntimeAiManifests(texts)
    .flatMap((manifest) =>
      manifest.dependencies.map((name) => ({
        name,
        manifestPath: manifest.path,
        manifestDirectory: manifest.directory,
        ecosystem: manifest.ecosystem
      }))
    )
    .sort((left, right) =>
      compareCanonicalText(
        `${left.ecosystem}\0${left.manifestPath}\0${left.name}`,
        `${right.ecosystem}\0${right.manifestPath}\0${right.name}`
      )
    );
}

interface JavascriptStringLiteral {
  start: number;
  end: number;
}

function maskJavascriptInactiveRegions(text: string): string {
  const masked = [...text];
  const literals: JavascriptStringLiteral[] = [];
  const mask = (index: number): void => {
    if (masked[index] !== "\n") masked[index] = " ";
  };

  function scanCode(start: number, templateExpression = false): number {
    let braceDepth = templateExpression ? 1 : 0;
    for (let index = start; index < text.length; index += 1) {
      const current = text[index];
      const next = text[index + 1];
      if (templateExpression && current === "{") {
        braceDepth += 1;
        continue;
      }
      if (templateExpression && current === "}") {
        braceDepth -= 1;
        if (braceDepth === 0) return index;
        continue;
      }
      if (current === "/" && next === "/") {
        mask(index);
        mask(index + 1);
        index += 2;
        while (index < text.length && text[index] !== "\n") {
          mask(index);
          index += 1;
        }
        index -= 1;
        continue;
      }
      if (current === "/" && next === "*") {
        mask(index);
        mask(index + 1);
        index += 2;
        while (index < text.length) {
          if (text[index] === "*" && text[index + 1] === "/") {
            mask(index);
            mask(index + 1);
            index += 1;
            break;
          }
          mask(index);
          index += 1;
        }
        continue;
      }
      if (current === "'" || current === '"') {
        const literalStart = index;
        const quote = current;
        mask(index);
        index += 1;
        while (index < text.length) {
          if (text[index] === "\\") {
            mask(index);
            if (index + 1 < text.length) mask(++index);
          } else if (text[index] === quote) {
            mask(index);
            break;
          } else {
            mask(index);
          }
          index += 1;
        }
        literals.push({ start: literalStart, end: index });
        continue;
      }
      if (current === "`") {
        mask(index);
        index += 1;
        while (index < text.length) {
          if (text[index] === "\\") {
            mask(index);
            if (index + 1 < text.length) mask(++index);
          } else if (text[index] === "`") {
            mask(index);
            break;
          } else if (text[index] === "$" && text[index + 1] === "{") {
            mask(index);
            index = scanCode(index + 2, true);
          } else {
            mask(index);
          }
          index += 1;
        }
      }
    }
    return text.length;
  }

  scanCode(0);
  for (const literal of literals) {
    const prefix = masked.slice(0, literal.start).join("");
    if (!/(?:\bfrom|\bimport\s*\(|\bimport|\brequire\s*\()\s*$/.test(prefix)) continue;
    for (let index = literal.start; index <= literal.end; index += 1) {
      masked[index] = text[index] ?? "";
    }
  }
  return masked.join("");
}

function aiImportTokens(dependency: string): string[] {
  const lower = normalizeIdentifier(dependency);
  if (lower.includes("openai")) return ["openai", "async_openai", "com.openai"];
  if (lower.includes("anthropic")) return ["anthropic", "com.anthropic"];
  if (lower.includes("langchain")) return ["langchain", "dev.langchain4j"];
  if (lower.includes("langgraph")) return ["langgraph"];
  if (/llama[-_.]?index/.test(lower)) return ["llama_index", "llamaindex"];
  if (lower.includes("ollama")) return ["ollama"];
  if (/semantic[-_.]?kernel/.test(lower)) return ["semantic_kernel"];
  if (lower.includes("spring") && lower.includes("ai")) return ["org.springframework.ai"];
  if (lower.includes("ai-sdk")) return ["ai", "@ai-sdk"];
  return [];
}

export function sourceImports(repositoryPath: string, rawText: string): string[] {
  const normalizedPath = normalizeRepositoryPath(repositoryPath);
  const text = rawText.replace(/\r\n?/g, "\n");
  const imports = new Set<string>();
  if (/\.[cm]?[jt]sx?$/i.test(normalizedPath)) {
    for (const match of maskJavascriptInactiveRegions(text).matchAll(
      /(?:\bfrom\s+|\bimport\s*\(|\bimport\s+|\brequire\s*\()\s*["']([^"']+)["']/g
    )) {
      if (match[1] !== undefined) imports.add(normalizeIdentifier(match[1]));
    }
  } else if (/\.py$/i.test(normalizedPath)) {
    for (const match of text.matchAll(/^\s*(?:from|import)\s+([A-Za-z0-9_.]+)/gm)) {
      if (match[1] !== undefined) imports.add(normalizeIdentifier(match[1]));
    }
  } else if (/\.rs$/i.test(normalizedPath)) {
    for (const match of text.matchAll(/^\s*(?:use|extern\s+crate)\s+([A-Za-z0-9_]+)/gm)) {
      if (match[1] !== undefined) imports.add(normalizeIdentifier(match[1]));
    }
  } else if (/\.go$/i.test(normalizedPath)) {
    for (const match of text.matchAll(/\bimport\s*(?:\(([\s\S]*?)\)|"([^"]+)")/g)) {
      if (match[2] !== undefined) imports.add(normalizeIdentifier(match[2]));
      for (const quoted of (match[1] ?? "").matchAll(/"([^"]+)"/g)) {
        if (quoted[1] !== undefined) imports.add(normalizeIdentifier(quoted[1]));
      }
    }
  } else if (/\.(?:java|kt|kts)$/i.test(normalizedPath)) {
    for (const match of text.matchAll(/^\s*import\s+([A-Za-z0-9_.]+)/gm)) {
      if (match[1] !== undefined) imports.add(normalizeIdentifier(match[1]));
    }
  }
  return [...imports].sort(compareCanonicalText);
}

function importMatchesDependency(importName: string, dependency: string): boolean {
  const normalizedImport = normalizeIdentifier(importName);
  const fullDependency = normalizeIdentifier(dependency);
  const normalizedDependency = fullDependency.split(":").pop() ?? fullDependency;
  if (
    normalizedImport === fullDependency ||
    normalizedImport.startsWith(fullDependency + "/") ||
    normalizedImport === normalizedDependency ||
    normalizedImport.startsWith(normalizedDependency + "/")
  ) {
    return true;
  }
  return aiImportTokens(fullDependency).some(
    (token) =>
      normalizedImport === token ||
      normalizedImport.startsWith(token + "/") ||
      normalizedImport.startsWith(token + ".") ||
      normalizedImport.includes("/" + token)
  );
}

export function analyzeRuntimeAiEvidence(texts: ReadonlyMap<string, string>): RuntimeAiEvidence {
  const manifests = readRuntimeAiManifests(texts);
  const dependencies = readAiDependencies(texts);
  const matchedDependencyKeys = new Set<string>();
  const matchedImportsBySource = new Map<string, readonly string[]>();
  const dependenciesByManifest = new Map<string, readonly string[]>();

  for (const dependency of dependencies) {
    const current = dependenciesByManifest.get(dependency.manifestPath) ?? [];
    dependenciesByManifest.set(
      dependency.manifestPath,
      [...new Set([...current, dependency.name])].sort(compareCanonicalText)
    );
  }
  for (const [rawPath, text] of texts) {
    const repositoryPath = normalizeRepositoryPath(rawPath);
    const ecosystem = sourceEcosystem(repositoryPath);
    if (ecosystem === undefined) continue;
    const sourceDirectory = path.posix.dirname(repositoryPath);
    const applicableManifest = manifests
      .filter(
        (manifest) =>
          manifest.ecosystem === ecosystem &&
          (manifest.directory === "" ||
            sourceDirectory === manifest.directory ||
            sourceDirectory.startsWith(manifest.directory + "/"))
      )
      .sort(
        (left, right) =>
          (right.directory === "" ? 0 : right.directory.split("/").length) -
            (left.directory === "" ? 0 : left.directory.split("/").length) ||
          compareCanonicalText(left.path, right.path)
      )[0];
    if (applicableManifest === undefined) continue;
    const imports = sourceImports(repositoryPath, text);
    const matches = new Set<string>();
    const applicableDependencies = dependencies.filter(
      (dependency) =>
        dependency.ecosystem === ecosystem && dependency.manifestPath === applicableManifest.path
    );
    for (const dependency of applicableDependencies) {
      for (const importName of imports) {
        if (!importMatchesDependency(importName, dependency.name)) continue;
        matches.add(`${dependency.name}=>${importName}`);
        matchedDependencyKeys.add(`${dependency.manifestPath}\0${dependency.name}`);
      }
    }
    if (matches.size > 0) {
      matchedImportsBySource.set(repositoryPath, [...matches].sort(compareCanonicalText));
    }
  }
  const matchedDependencies = dependencies.filter((dependency) =>
    matchedDependencyKeys.has(`${dependency.manifestPath}\0${dependency.name}`)
  );
  const unmatchedDependencies = dependencies.filter(
    (dependency) => !matchedDependencyKeys.has(`${dependency.manifestPath}\0${dependency.name}`)
  );
  return {
    dependencies,
    matchedDependencies,
    unmatchedDependencies,
    matchedImportsBySource,
    dependenciesByManifest
  };
}

export function bindRuntimeAiFingerprintEvidence(
  establishmentDigest: string,
  repositoryPath: string,
  evidence: RuntimeAiEvidence
): string {
  const pathKey = normalizeRepositoryPath(repositoryPath);
  const matchedImports = evidence.matchedImportsBySource.get(pathKey) ?? [];
  const declaredDependencies = evidence.dependenciesByManifest.get(pathKey) ?? [];
  if (matchedImports.length === 0 && declaredDependencies.length === 0) return establishmentDigest;
  return stableHash({ establishmentDigest, declaredDependencies, matchedImports });
}
