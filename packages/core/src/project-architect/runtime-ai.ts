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
  matchedTestImportsBySource: ReadonlyMap<string, readonly string[]>;
  dependenciesByManifest: ReadonlyMap<string, readonly string[]>;
}

export interface RuntimeAiAnalysisInput {
  texts: ReadonlyMap<string, string>;
  productionSourcePaths: ReadonlySet<string>;
  testSourcePaths?: ReadonlySet<string>;
}

interface RuntimeAiRegistryEntry {
  ecosystem: RuntimeAiEcosystem;
  dependency: string;
  exactImports: readonly string[];
  importPrefixes?: readonly string[];
}

const RUNTIME_AI_REGISTRY: readonly RuntimeAiRegistryEntry[] = [
  {
    ecosystem: "javascript",
    dependency: "openai",
    exactImports: ["openai"],
    importPrefixes: ["openai/"]
  },
  {
    ecosystem: "javascript",
    dependency: "@anthropic-ai/sdk",
    exactImports: ["@anthropic-ai/sdk"],
    importPrefixes: ["@anthropic-ai/sdk/"]
  },
  {
    ecosystem: "javascript",
    dependency: "langchain",
    exactImports: ["langchain"],
    importPrefixes: ["langchain/"]
  },
  {
    ecosystem: "javascript",
    dependency: "@langchain/core",
    exactImports: ["@langchain/core"],
    importPrefixes: ["@langchain/core/"]
  },
  {
    ecosystem: "javascript",
    dependency: "@langchain/langgraph",
    exactImports: ["@langchain/langgraph"],
    importPrefixes: ["@langchain/langgraph/"]
  },
  {
    ecosystem: "javascript",
    dependency: "llamaindex",
    exactImports: ["llamaindex"],
    importPrefixes: ["llamaindex/"]
  },
  {
    ecosystem: "javascript",
    dependency: "ollama",
    exactImports: ["ollama"],
    importPrefixes: ["ollama/"]
  },
  { ecosystem: "javascript", dependency: "ai", exactImports: ["ai"], importPrefixes: ["ai/"] },
  {
    ecosystem: "javascript",
    dependency: "@ai-sdk/openai",
    exactImports: ["@ai-sdk/openai"],
    importPrefixes: ["@ai-sdk/openai/"]
  },
  {
    ecosystem: "python",
    dependency: "openai",
    exactImports: ["openai"],
    importPrefixes: ["openai."]
  },
  {
    ecosystem: "python",
    dependency: "anthropic",
    exactImports: ["anthropic"],
    importPrefixes: ["anthropic."]
  },
  {
    ecosystem: "python",
    dependency: "langchain",
    exactImports: ["langchain"],
    importPrefixes: ["langchain."]
  },
  {
    ecosystem: "python",
    dependency: "langgraph",
    exactImports: ["langgraph"],
    importPrefixes: ["langgraph."]
  },
  {
    ecosystem: "python",
    dependency: "llama-index",
    exactImports: ["llama_index"],
    importPrefixes: ["llama_index."]
  },
  {
    ecosystem: "python",
    dependency: "ollama",
    exactImports: ["ollama"],
    importPrefixes: ["ollama."]
  },
  {
    ecosystem: "python",
    dependency: "semantic-kernel",
    exactImports: ["semantic_kernel"],
    importPrefixes: ["semantic_kernel."]
  },
  {
    ecosystem: "rust",
    dependency: "async-openai",
    exactImports: ["async_openai"],
    importPrefixes: ["async_openai::"]
  },
  {
    ecosystem: "go",
    dependency: "github.com/sashabaranov/go-openai",
    exactImports: ["github.com/sashabaranov/go-openai"],
    importPrefixes: ["github.com/sashabaranov/go-openai/"]
  },
  {
    ecosystem: "jvm",
    dependency: "com.openai:openai-java",
    exactImports: ["com.openai"],
    importPrefixes: ["com.openai."]
  },
  {
    ecosystem: "jvm",
    dependency: "com.anthropic:anthropic-java",
    exactImports: ["com.anthropic"],
    importPrefixes: ["com.anthropic."]
  },
  {
    ecosystem: "jvm",
    dependency: "dev.langchain4j:langchain4j",
    exactImports: ["dev.langchain4j"],
    importPrefixes: ["dev.langchain4j."]
  },
  {
    ecosystem: "jvm",
    dependency: "org.springframework.ai:spring-ai-openai",
    exactImports: ["org.springframework.ai"],
    importPrefixes: ["org.springframework.ai."]
  }
];

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

function isAiDependencyCandidate(value: string): boolean {
  return /openai|anthropic|langchain|langgraph|llama[-_.]?index|ollama|semantic[-_.]?kernel|ai-sdk|spring[-_.]?ai/i.test(
    value
  );
}

function dependencyName(value: string): string | undefined {
  return value.trim().match(/^([@A-Za-z0-9][@A-Za-z0-9_./-]*)/)?.[1];
}

function readPythonDependencies(text: string): string[] {
  const dependencies = new Set<string>();
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let section = "";

  const stripComment = (line: string): string => {
    let quote: "'" | '"' | undefined;
    let escaped = false;
    for (let index = 0; index < line.length; index += 1) {
      const current = line[index];
      if (quote !== undefined) {
        if (quote === '"' && current === "\\" && !escaped) {
          escaped = true;
          continue;
        }
        if (current === quote && !escaped) quote = undefined;
        escaped = false;
        continue;
      }
      if (current === "'" || current === '"') quote = current;
      else if (current === "#") return line.slice(0, index);
    }
    return line;
  };

  const readArray = (
    startIndex: number,
    assignment: string
  ): { values: string[]; end: number } | undefined => {
    let value = assignment;
    let end = startIndex;
    while (!value.includes("]") && end + 1 < lines.length) {
      end += 1;
      const next = stripComment(lines[end] ?? "");
      if (/^\s*\[/.test(next)) return undefined;
      value += `\n${next}`;
    }
    const array = value.match(/^\s*\[([\s\S]*)]\s*,?\s*$/)?.[1];
    if (array === undefined || /'''|"""/.test(array)) return undefined;
    const values: string[] = [];
    let remainder = array;
    const quoted = /(?:"((?:\\.|[^"\\])*)"|'([^']*)')/g;
    for (const match of array.matchAll(quoted)) {
      values.push((match[1] ?? match[2] ?? "").replace(/\\(["'\\])/g, "$1"));
      remainder = remainder.replace(match[0], "");
    }
    if (!/^[\s,]*$/.test(remainder)) return undefined;
    return { values, end };
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = stripComment(lines[index] ?? "");
    const header = line
      .match(/^\s*\[([^\]]+)]\s*$/)?.[1]
      ?.trim()
      .toLowerCase();
    if (header !== undefined) {
      section = header;
      continue;
    }
    const assignment = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=\s*([\s\S]*)$/);
    if (assignment === null) continue;
    const key = normalizeIdentifier(assignment[1] ?? "");
    const value = assignment[2] ?? "";
    if (
      (section === "project" && key === "dependencies") ||
      section === "project.optional-dependencies"
    ) {
      const parsed = readArray(index, value);
      if (parsed === undefined) continue;
      index = parsed.end;
      for (const requirement of parsed.values) {
        const name = dependencyName(requirement);
        if (name !== undefined && isAiDependencyCandidate(name)) {
          dependencies.add(normalizeIdentifier(name));
        }
      }
    } else if (section === "tool.poetry.dependencies") {
      if (value.trim() !== "" && !/'''|"""/.test(value) && isAiDependencyCandidate(key)) {
        dependencies.add(key);
      }
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
    if (name !== undefined && isAiDependencyCandidate(name))
      dependencies.add(normalizeIdentifier(name));
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
    if (value !== undefined && isAiDependencyCandidate(value))
      dependencies.add(normalizeIdentifier(value));
  }
  return [...dependencies].sort(compareCanonicalText);
}

function readMavenDependencies(text: string): string[] {
  interface MavenElement {
    qualifiedName: string;
    localName: string;
    namespaceUri: string;
    namespaceBindings: Map<string, string>;
  }

  interface MavenAttribute {
    qualifiedName: string;
    prefix?: string;
    localName: string;
    value: string;
  }

  interface MavenDependency {
    groupId?: string;
    artifactId?: string;
    scope?: string;
    invalid: boolean;
  }

  interface MavenTextCapture {
    field: "groupId" | "artifactId" | "scope";
    depth: number;
    text: string;
    invalid: boolean;
  }

  const dependencies = new Set<string>();
  const source = text.replace(/\r\n?/g, "\n");
  const stack: MavenElement[] = [];
  let dependency: MavenDependency | undefined;
  let capture: MavenTextCapture | undefined;
  let rootSeen = false;
  let rootClosed = false;

  const MAVEN_NAMESPACE = "http://maven.apache.org/POM/4.0.0";
  const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
  const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
  const XSI_NAMESPACE = "http://www.w3.org/2001/XMLSchema-instance";
  const ALLOWED_DECLARED_NAMESPACES = new Set(["", MAVEN_NAMESPACE, XML_NAMESPACE, XSI_NAMESPACE]);

  const fail = (): string[] => [];
  const splitQualifiedName = (
    qualifiedName: string
  ): { prefix?: string; localName: string } | undefined => {
    const match = qualifiedName.match(
      /^(?:([A-Za-z_][A-Za-z0-9_.-]*):)?([A-Za-z_][A-Za-z0-9_.-]*)$/
    );
    if (match === null) return undefined;
    return {
      ...(match[1] === undefined ? {} : { prefix: match[1] }),
      localName: match[2] as string
    };
  };
  const ancestry = (): string[] => stack.map((element) => element.localName);
  const validEntityReferences = (value: string): boolean => {
    for (let index = value.indexOf("&"); index !== -1; index = value.indexOf("&", index + 1)) {
      const reference = value.slice(index).match(/^&(?:amp|lt|gt|apos|quot|#\d+|#x[0-9A-Fa-f]+);/);
      if (reference === null) return false;
      index += reference[0].length - 1;
    }
    return true;
  };
  const finishCapture = (): boolean => {
    if (capture === undefined || dependency === undefined) return false;
    const value = capture.text.trim();
    if (
      capture.invalid ||
      value === "" ||
      value.includes("&") ||
      dependency[capture.field] !== undefined
    ) {
      dependency.invalid = true;
    } else {
      dependency[capture.field] = value;
    }
    capture = undefined;
    return true;
  };
  const readTagEnd = (start: number): number | undefined => {
    let quote: "'" | '"' | undefined;
    for (let index = start; index < source.length; index += 1) {
      const current = source[index];
      if (quote !== undefined) {
        if (current === quote) quote = undefined;
      } else if (current === "'" || current === '"') {
        quote = current;
      } else if (current === "<") {
        return undefined;
      } else if (current === ">") {
        return index;
      }
    }
    return undefined;
  };
  const readAttributes = (value: string): MavenAttribute[] | undefined => {
    const attributes: MavenAttribute[] = [];
    let rest = value;
    while (rest.trim() !== "") {
      const match = rest.match(/^\s+([A-Za-z_][A-Za-z0-9_.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/);
      if (match === null) return undefined;
      const qualifiedName = match[1] as string;
      const name = splitQualifiedName(qualifiedName);
      const attributeValue = (match[2] ?? match[3]) as string;
      if (name === undefined || !validEntityReferences(attributeValue)) return undefined;
      attributes.push({ qualifiedName, ...name, value: attributeValue });
      rest = rest.slice(match[0].length);
    }
    return attributes;
  };
  const resolveElement = (
    qualifiedName: string,
    attributes: readonly MavenAttribute[]
  ): MavenElement | undefined => {
    const name = splitQualifiedName(qualifiedName);
    if (name === undefined || name.prefix === "xmlns") return undefined;
    const namespaceBindings = new Map(stack.at(-1)?.namespaceBindings ?? [["xml", XML_NAMESPACE]]);

    for (const attribute of attributes) {
      const namespacePrefix =
        attribute.qualifiedName === "xmlns"
          ? ""
          : attribute.prefix === "xmlns"
            ? attribute.localName
            : undefined;
      if (namespacePrefix === undefined) continue;
      if (
        namespacePrefix === "xmlns" ||
        (namespacePrefix === "xml" && attribute.value !== XML_NAMESPACE) ||
        (namespacePrefix !== "xml" && attribute.value === XML_NAMESPACE) ||
        !ALLOWED_DECLARED_NAMESPACES.has(attribute.value) ||
        (namespacePrefix !== "" && attribute.value === "")
      ) {
        return undefined;
      }
      namespaceBindings.set(namespacePrefix, attribute.value);
    }

    const namespaceUri =
      name.prefix === undefined
        ? (namespaceBindings.get("") ?? "")
        : namespaceBindings.get(name.prefix);
    if (namespaceUri === undefined || (namespaceUri !== "" && namespaceUri !== MAVEN_NAMESPACE)) {
      return undefined;
    }

    const expandedAttributes = new Set<string>();
    for (const attribute of attributes) {
      let attributeNamespace = "";
      let attributeLocalName = attribute.localName;
      if (attribute.qualifiedName === "xmlns") {
        attributeNamespace = XMLNS_NAMESPACE;
        attributeLocalName = "xmlns";
      } else if (attribute.prefix === "xmlns") {
        attributeNamespace = XMLNS_NAMESPACE;
      } else if (attribute.prefix !== undefined) {
        const resolved = namespaceBindings.get(attribute.prefix);
        if (resolved === undefined) return undefined;
        attributeNamespace = resolved;
      }
      if (
        attributeNamespace !== "" &&
        attributeNamespace !== MAVEN_NAMESPACE &&
        attributeNamespace !== XML_NAMESPACE &&
        attributeNamespace !== XMLNS_NAMESPACE &&
        attributeNamespace !== XSI_NAMESPACE
      ) {
        return undefined;
      }
      const expandedName = `{${attributeNamespace}}${attributeLocalName}`;
      if (expandedAttributes.has(expandedName)) return undefined;
      expandedAttributes.add(expandedName);
    }

    return { qualifiedName, localName: name.localName, namespaceUri, namespaceBindings };
  };

  for (let index = 0; index < source.length;) {
    if (source[index] !== "<") {
      const nextTag = source.indexOf("<", index);
      const end = nextTag === -1 ? source.length : nextTag;
      const value = source.slice(index, end);
      if (!validEntityReferences(value)) return fail();
      if (stack.length === 0 && value.trim() !== "") return fail();
      if (capture !== undefined && stack.length === capture.depth) capture.text += value;
      index = end;
      continue;
    }

    if (source.startsWith("<!--", index)) {
      const end = source.indexOf("-->", index + 4);
      if (end === -1 || source.slice(index + 4, end).includes("--")) return fail();
      if (capture !== undefined) capture.invalid = true;
      index = end + 3;
      continue;
    }
    if (source.startsWith("<![CDATA[", index)) {
      const end = source.indexOf("]]>", index + 9);
      if (end === -1 || stack.length === 0) return fail();
      if (capture !== undefined) capture.invalid = true;
      index = end + 3;
      continue;
    }
    if (source.startsWith("<?", index)) {
      const end = source.indexOf("?>", index + 2);
      if (end === -1) return fail();
      if (capture !== undefined) capture.invalid = true;
      index = end + 2;
      continue;
    }
    if (source.startsWith("<!", index)) return fail();

    const end = readTagEnd(index + 1);
    if (end === undefined) return fail();
    const rawTag = source.slice(index + 1, end);
    if (rawTag.startsWith("/")) {
      const closing = rawTag.match(/^\/\s*([A-Za-z_][A-Za-z0-9_.:-]*)\s*$/)?.[1];
      const current = stack.at(-1);
      if (closing === undefined || current === undefined || current.qualifiedName !== closing) {
        return fail();
      }
      if (capture !== undefined && capture.depth === stack.length) finishCapture();
      if (dependency !== undefined && stack.length === 3 && current.localName === "dependency") {
        const groupId = dependency.groupId?.trim();
        const artifactId = dependency.artifactId?.trim();
        const scope = dependency.scope?.trim();
        if (
          !dependency.invalid &&
          groupId !== undefined &&
          artifactId !== undefined &&
          (scope === undefined || ["compile", "runtime", "provided", "system"].includes(scope))
        ) {
          const name = `${groupId}:${artifactId}`;
          if (isAiDependencyCandidate(name)) dependencies.add(normalizeIdentifier(name));
        }
        dependency = undefined;
      }
      stack.pop();
      if (stack.length === 0) rootClosed = true;
      index = end + 1;
      continue;
    }

    const selfClosing = /\/\s*$/.test(rawTag);
    const tagBody = selfClosing ? rawTag.replace(/\/\s*$/, "") : rawTag;
    const opening = tagBody.match(/^\s*([A-Za-z_][A-Za-z0-9_.:-]*)/)?.[1];
    if (opening === undefined) return fail();
    const openingEnd = tagBody.indexOf(opening) + opening.length;
    const attributes = readAttributes(tagBody.slice(openingEnd));
    if (attributes === undefined) return fail();
    if (rootClosed) return fail();
    if (capture !== undefined) capture.invalid = true;

    const element = resolveElement(opening, attributes);
    if (element === undefined) return fail();
    if (stack.length === 0) {
      if (rootSeen || element.localName !== "project") return fail();
      rootSeen = true;
    }
    stack.push(element);
    const currentAncestry = ancestry();
    if (
      currentAncestry.length === 3 &&
      currentAncestry[0] === "project" &&
      currentAncestry[1] === "dependencies" &&
      currentAncestry[2] === "dependency"
    ) {
      dependency = { invalid: selfClosing };
    } else if (
      dependency !== undefined &&
      currentAncestry.length === 4 &&
      (element.localName === "groupId" ||
        element.localName === "artifactId" ||
        element.localName === "scope")
    ) {
      capture = {
        field: element.localName,
        depth: stack.length,
        text: "",
        invalid: selfClosing
      };
    }

    if (selfClosing) {
      if (capture !== undefined && capture.depth === stack.length) finishCapture();
      if (dependency !== undefined && stack.length === 3 && element.localName === "dependency") {
        dependency = undefined;
      }
      stack.pop();
      if (stack.length === 0) rootClosed = true;
    }
    index = end + 1;
  }

  if (!rootSeen || !rootClosed || stack.length !== 0 || capture !== undefined) return fail();
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
          .filter(isAiDependencyCandidate)
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

interface MaskedStringLiteral {
  start: number;
  end: number;
  kind: "double" | "other";
}

interface MaskedSource {
  text: string;
  literals: readonly MaskedStringLiteral[];
}

function maskPythonInactiveRegions(text: string): string {
  const masked = [...text];
  const mask = (index: number): void => {
    if (masked[index] !== "\n") masked[index] = " ";
  };
  for (let index = 0; index < text.length; index += 1) {
    const current = text[index];
    if (current === "#") {
      while (index < text.length && text[index] !== "\n") mask(index++);
      index -= 1;
      continue;
    }
    if (current !== "'" && current !== '"') continue;
    const triple = text.slice(index, index + 3) === current.repeat(3);
    const delimiter = triple ? current.repeat(3) : current;
    for (let count = 0; count < delimiter.length; count += 1) mask(index + count);
    index += delimiter.length;
    while (index < text.length) {
      if (!triple && text[index] === "\\") {
        mask(index);
        if (index + 1 < text.length) mask(++index);
      } else if (text.slice(index, index + delimiter.length) === delimiter) {
        for (let count = 0; count < delimiter.length; count += 1) mask(index + count);
        index += delimiter.length - 1;
        break;
      } else {
        mask(index);
      }
      index += 1;
    }
  }
  return masked.join("");
}

function maskCLikeInactiveRegions(
  text: string,
  options: {
    nestedBlockComments?: boolean;
    backtickStrings?: boolean;
    tripleDoubleStrings?: boolean;
    rustRawStrings?: boolean;
  } = {}
): MaskedSource {
  const masked = [...text];
  const literals: MaskedStringLiteral[] = [];
  const mask = (index: number): void => {
    if (masked[index] !== "\n") masked[index] = " ";
  };
  const maskRange = (start: number, end: number): void => {
    for (let index = start; index <= end; index += 1) mask(index);
  };

  for (let index = 0; index < text.length; index += 1) {
    const current = text[index];
    const next = text[index + 1];
    if (current === "/" && next === "/") {
      while (index < text.length && text[index] !== "\n") mask(index++);
      index -= 1;
      continue;
    }
    if (current === "/" && next === "*") {
      let depth = 1;
      maskRange(index, index + 1);
      index += 2;
      while (index < text.length && depth > 0) {
        if (options.nestedBlockComments && text[index] === "/" && text[index + 1] === "*") {
          depth += 1;
          maskRange(index, index + 1);
          index += 2;
          continue;
        }
        if (text[index] === "*" && text[index + 1] === "/") {
          depth -= 1;
          maskRange(index, index + 1);
          index += 2;
          continue;
        }
        mask(index++);
      }
      index -= 1;
      continue;
    }
    if (options.rustRawStrings) {
      const raw = text.slice(index).match(/^(?:br|r)(#{0,16})"/);
      if (raw !== null) {
        const close = `"${raw[1] ?? ""}`;
        const contentStart = index + raw[0].length;
        const closingIndex = text.indexOf(close, contentStart);
        const end = closingIndex < 0 ? text.length - 1 : closingIndex + close.length - 1;
        maskRange(index, end);
        literals.push({ start: index, end, kind: "other" });
        index = end;
        continue;
      }
    }
    if (options.tripleDoubleStrings && text.slice(index, index + 3) === '"""') {
      const closingIndex = text.indexOf('"""', index + 3);
      const end = closingIndex < 0 ? text.length - 1 : closingIndex + 2;
      maskRange(index, end);
      literals.push({ start: index, end, kind: "other" });
      index = end;
      continue;
    }
    if (options.backtickStrings && current === "`") {
      const closingIndex = text.indexOf("`", index + 1);
      const end = closingIndex < 0 ? text.length - 1 : closingIndex;
      maskRange(index, end);
      literals.push({ start: index, end, kind: "other" });
      index = end;
      continue;
    }
    const characterLiteral =
      current === "'" ? /^'(?:\\.|[^'\\\n])'/.exec(text.slice(index))?.[0] : undefined;
    if (current !== '"' && characterLiteral === undefined) continue;
    const literalStart = index;
    const quote = current;
    if (characterLiteral !== undefined) {
      index += characterLiteral.length - 1;
      maskRange(literalStart, index);
    } else {
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
    }
    literals.push({ start: literalStart, end: index, kind: quote === '"' ? "double" : "other" });
  }
  return { text: masked.join(""), literals };
}

function restoreGoImportStrings(text: string, masked: MaskedSource): string {
  const restored = [...masked.text];
  const groupedRanges = [...masked.text.matchAll(/^\s*import\s*\([\s\S]*?^\s*\)/gm)].map(
    (match) => [match.index, (match.index ?? 0) + match[0].length] as const
  );
  for (const literal of masked.literals) {
    if (literal.kind !== "double") continue;
    const lineStart = masked.text.lastIndexOf("\n", literal.start - 1) + 1;
    const prefix = masked.text.slice(lineStart, literal.start);
    const direct = /^\s*import(?:\s+[._A-Za-z][A-Za-z0-9_]*)?\s*$/.test(prefix);
    const grouped = groupedRanges.some(
      ([start, end]) => literal.start >= start && literal.end < end
    );
    if (!direct && !grouped) continue;
    for (let index = literal.start; index <= literal.end; index += 1) {
      restored[index] = text[index] ?? "";
    }
  }
  return restored.join("");
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
    for (const match of maskPythonInactiveRegions(text).matchAll(
      /^\s*(?:from|import)\s+([A-Za-z0-9_.]+)/gm
    )) {
      if (match[1] !== undefined) imports.add(normalizeIdentifier(match[1]));
    }
  } else if (/\.rs$/i.test(normalizedPath)) {
    const masked = maskCLikeInactiveRegions(text, {
      nestedBlockComments: true,
      rustRawStrings: true
    }).text;
    for (const match of masked.matchAll(/^\s*(?:use|extern\s+crate)\s+([A-Za-z0-9_]+)/gm)) {
      if (match[1] !== undefined) imports.add(normalizeIdentifier(match[1]));
    }
  } else if (/\.go$/i.test(normalizedPath)) {
    const goText = restoreGoImportStrings(
      text,
      maskCLikeInactiveRegions(text, { backtickStrings: true })
    );
    for (const match of goText.matchAll(/^\s*import\s*(?:\(([\s\S]*?)\)|"([^"]+)")/gm)) {
      if (match[2] !== undefined) imports.add(normalizeIdentifier(match[2]));
      for (const quoted of (match[1] ?? "").matchAll(/"([^"]+)"/g)) {
        if (quoted[1] !== undefined) imports.add(normalizeIdentifier(quoted[1]));
      }
    }
  } else if (/\.(?:java|kt|kts)$/i.test(normalizedPath)) {
    const masked = maskCLikeInactiveRegions(text, {
      tripleDoubleStrings: /\.(?:kt|kts)$/i.test(normalizedPath)
    }).text;
    for (const match of masked.matchAll(/^\s*import\s+([A-Za-z0-9_.]+)/gm)) {
      if (match[1] !== undefined) imports.add(normalizeIdentifier(match[1]));
    }
  }
  return [...imports].sort(compareCanonicalText);
}

function importMatchesDependency(
  importName: string,
  dependency: string,
  ecosystem: RuntimeAiEcosystem
): boolean {
  const normalizedImport = normalizeIdentifier(importName);
  const entry = RUNTIME_AI_REGISTRY.find(
    (candidate) =>
      candidate.ecosystem === ecosystem && candidate.dependency === normalizeIdentifier(dependency)
  );
  return (
    entry !== undefined &&
    (entry.exactImports.includes(normalizedImport) ||
      entry.importPrefixes?.some((prefix) => normalizedImport.startsWith(prefix)) === true)
  );
}

function isRegisteredDependency(dependency: AiDependency): boolean {
  return RUNTIME_AI_REGISTRY.some(
    (entry) => entry.ecosystem === dependency.ecosystem && entry.dependency === dependency.name
  );
}

export function analyzeRuntimeAiEvidence(input: RuntimeAiAnalysisInput): RuntimeAiEvidence {
  const { texts } = input;
  const manifests = readRuntimeAiManifests(texts);
  const dependencies = readAiDependencies(texts);
  const matchedDependencyKeys = new Set<string>();
  const matchedImportsBySource = new Map<string, readonly string[]>();
  const matchedTestImportsBySource = new Map<string, readonly string[]>();
  const dependenciesByManifest = new Map<string, readonly string[]>();

  for (const dependency of dependencies.filter(isRegisteredDependency)) {
    const current = dependenciesByManifest.get(dependency.manifestPath) ?? [];
    dependenciesByManifest.set(
      dependency.manifestPath,
      [...new Set([...current, dependency.name])].sort(compareCanonicalText)
    );
  }
  const matchSources = (
    rawPaths: ReadonlySet<string>,
    target: Map<string, readonly string[]>,
    confirmRuntime: boolean
  ): void => {
    const paths = [...rawPaths].map(normalizeRepositoryPath).sort(compareCanonicalText);
    for (const repositoryPath of paths) {
      const text = texts.get(repositoryPath) ?? texts.get(repositoryPath.replace(/\//g, "\\"));
      if (text === undefined) continue;
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
          dependency.ecosystem === ecosystem &&
          dependency.manifestPath === applicableManifest.path &&
          isRegisteredDependency(dependency)
      );
      for (const dependency of applicableDependencies) {
        for (const importName of imports) {
          if (!importMatchesDependency(importName, dependency.name, ecosystem)) continue;
          matches.add(`${dependency.name}=>${importName}`);
          if (confirmRuntime) {
            matchedDependencyKeys.add(`${dependency.manifestPath}\0${dependency.name}`);
          }
        }
      }
      if (matches.size > 0) {
        target.set(repositoryPath, [...matches].sort(compareCanonicalText));
      }
    }
  };

  matchSources(input.productionSourcePaths, matchedImportsBySource, true);
  matchSources(input.testSourcePaths ?? new Set<string>(), matchedTestImportsBySource, false);
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
    matchedTestImportsBySource,
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
