import { lstat, readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

import type { ArtifactRecord } from "./model.js";
import { DevCharterError, failure, success, type Result } from "./results.js";
import { compareCanonicalText } from "./serialization.js";

const DEFAULT_IGNORED_NAMES = new Set([
  ".cache",
  ".git",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules"
]);

export interface InventoryOptions {
  ignoredPathPrefixes?: readonly string[];
  ignore?: (repositoryPath: string) => boolean;
}

function normalizeRepositoryPath(value: string): string {
  return value.split(path.sep).join("/");
}

function invalidRelativePath(value: string): boolean {
  return (
    value.length === 0 ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value) ||
    /^[A-Za-z]:/.test(value) ||
    value.startsWith("\\\\")
  );
}

function pathSegments(value: string): string[] {
  const segments = value.split(/[\\/]/);
  if (
    invalidRelativePath(value) ||
    segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")
  ) {
    throw new DevCharterError("PATH_OUTSIDE_ROOT", "Path must be repository-relative", {
      path: value
    });
  }
  return segments;
}

function isWithinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(".." + path.sep) && relative !== "..");
}

async function rejectSymlinkSegments(root: string, candidate: string): Promise<void> {
  const relative = path.relative(root, candidate);
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      const entry = await lstat(current);
      if (entry.isSymbolicLink()) {
        throw new DevCharterError(
          "SYMLINK_ESCAPE",
          "Symbolic links are not allowed in repository paths",
          {
            path: normalizeRepositoryPath(path.relative(root, current))
          }
        );
      }
    } catch (error) {
      if (error instanceof DevCharterError) throw error;
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
  }
}

export async function resolveRepositoryPath(
  canonicalRoot: string,
  repositoryPath: string,
  options: { mustExist: boolean }
): Promise<string> {
  const candidate = path.resolve(canonicalRoot, ...pathSegments(repositoryPath));
  if (!isWithinRoot(canonicalRoot, candidate)) {
    throw new DevCharterError("PATH_OUTSIDE_ROOT", "Path resolves outside the repository", {
      path: repositoryPath
    });
  }

  await rejectSymlinkSegments(canonicalRoot, candidate);
  if (options.mustExist) {
    const resolved = await realpath(candidate);
    if (!isWithinRoot(canonicalRoot, resolved)) {
      throw new DevCharterError("SYMLINK_ESCAPE", "Resolved path is outside the repository", {
        path: repositoryPath
      });
    }
    return resolved;
  }
  return candidate;
}

function classifyFile(repositoryPath: string): Pick<ArtifactRecord, "kind" | "origin"> {
  const name = path.posix.basename(repositoryPath);
  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(name)) {
    return { kind: "test", origin: "project" };
  }
  if (/\.(md|mdx|txt)$/.test(name)) return { kind: "documentation", origin: "project" };
  if (/\.(json|ya?ml|toml)$/.test(name)) return { kind: "configuration", origin: "project" };
  if (/\.[cm]?[jt]sx?$/.test(name)) return { kind: "source", origin: "project" };
  return { kind: "file", origin: "project" };
}

function classifyIgnored(name: string): Pick<ArtifactRecord, "kind" | "origin"> {
  if (name === "node_modules") return { kind: "dependency-directory", origin: "third-party" };
  if (name === ".git") return { kind: "version-control-directory", origin: "third-party" };
  return { kind: "generated-directory", origin: "generated-vendor" };
}

function matchesCustomIgnore(repositoryPath: string, options: InventoryOptions): boolean {
  if (options.ignore?.(repositoryPath) === true) return true;
  return (options.ignoredPathPrefixes ?? []).some((prefix) => {
    const normalized = prefix.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/$/, "");
    return repositoryPath === normalized || repositoryPath.startsWith(normalized + "/");
  });
}

export class RepositoryReader {
  readonly root: string;

  private constructor(canonicalRoot: string) {
    this.root = canonicalRoot;
  }

  static async create(root: string): Promise<Result<RepositoryReader>> {
    try {
      const canonicalRoot = await realpath(root);
      if (!(await stat(canonicalRoot)).isDirectory()) {
        return failure(
          new DevCharterError("READ_FAILED", "Repository root must be a directory", {
            path: root
          })
        );
      }
      return success(new RepositoryReader(canonicalRoot));
    } catch (cause) {
      return failure(
        new DevCharterError("READ_FAILED", "Repository root could not be opened", {
          path: root,
          cause
        })
      );
    }
  }

  async readText(repositoryPath: string): Promise<Result<string>> {
    try {
      const resolved = await resolveRepositoryPath(this.root, repositoryPath, { mustExist: true });
      if (!(await stat(resolved)).isFile()) {
        return failure(
          new DevCharterError("READ_FAILED", "Repository path is not a file", {
            path: repositoryPath
          })
        );
      }
      return success(await readFile(resolved, "utf8"));
    } catch (cause) {
      if (cause instanceof DevCharterError) return failure(cause);
      return failure(
        new DevCharterError("READ_FAILED", "Repository file could not be read", {
          path: repositoryPath,
          cause
        })
      );
    }
  }

  async pathExists(repositoryPath: string): Promise<Result<boolean>> {
    try {
      await resolveRepositoryPath(this.root, repositoryPath, { mustExist: true });
      return success(true);
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === "ENOENT") return success(false);
      if (cause instanceof DevCharterError) return failure(cause);
      return failure(
        new DevCharterError("READ_FAILED", "Repository path could not be inspected", {
          path: repositoryPath,
          cause
        })
      );
    }
  }

  async inventory(options: InventoryOptions = {}): Promise<Result<ArtifactRecord[]>> {
    const artifacts: ArtifactRecord[] = [];
    try {
      const visit = async (directory: string, relativeDirectory: string): Promise<void> => {
        const entries = await readdir(directory, { withFileTypes: true });
        entries.sort((left, right) => compareCanonicalText(left.name, right.name));

        for (const entry of entries) {
          const repositoryPath = relativeDirectory
            ? relativeDirectory + "/" + entry.name
            : entry.name;
          const absolutePath = path.join(directory, entry.name);

          if (entry.isSymbolicLink()) {
            artifacts.push({
              path: repositoryPath,
              kind: "symbolic-link",
              origin: "unknown"
            });
            continue;
          }

          if (entry.isDirectory()) {
            if (DEFAULT_IGNORED_NAMES.has(entry.name)) {
              if (entry.name !== ".git") {
                artifacts.push({ path: repositoryPath, ...classifyIgnored(entry.name) });
              }
              continue;
            }
            if (matchesCustomIgnore(repositoryPath, options)) {
              artifacts.push({
                path: repositoryPath,
                kind: "ignored-directory",
                origin: "unknown"
              });
              continue;
            }
            await visit(absolutePath, repositoryPath);
            continue;
          }

          if (!matchesCustomIgnore(repositoryPath, options)) {
            artifacts.push({ path: repositoryPath, ...classifyFile(repositoryPath) });
          }
        }
      };

      await visit(this.root, "");
      artifacts.sort((left, right) => compareCanonicalText(left.path, right.path));
      return success(artifacts);
    } catch (cause) {
      return failure(
        new DevCharterError("INVENTORY_FAILED", "Repository inventory failed", { cause })
      );
    }
  }
}
