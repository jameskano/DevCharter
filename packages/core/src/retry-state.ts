import { createHash } from "node:crypto";
import { lstat, readFile, readlink } from "node:fs/promises";
import path from "node:path";

import { RepositoryReader } from "./repository.js";
import { success, type Result } from "./results.js";
import { executeSafeGit, SAFE_GIT_PREFIX } from "./safe-git.js";
import { compareCanonicalText, stableHash } from "./serialization.js";

const CONTENT_LIMIT = 4 * 1024 * 1024;
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

export interface RetryState {
  version: 1;
  digest: string;
  exact: boolean;
}

function hash(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function likelySecret(repositoryPath: string): boolean {
  const normalized = repositoryPath.replace(/\\/g, "/").toLowerCase();
  const basename = path.posix.basename(normalized);
  return (
    basename === ".env" ||
    basename.startsWith(".env.") ||
    SECRET_BASENAMES.has(basename) ||
    /\.(key|pem|p12|pfx|jks|keystore)$/.test(basename) ||
    normalized
      .split("/")
      .some((segment) => [".ssh", ".aws", ".azure", ".gnupg", "secrets"].includes(segment))
  );
}

async function gitIdentity(
  root: string,
  excluded: ReadonlySet<string>
): Promise<{ value: unknown; exact: boolean }> {
  try {
    const marker = await lstat(path.join(root, ".git"));
    if (!marker.isDirectory()) return { value: { state: "unavailable" }, exact: false };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return { value: { state: "not-git" }, exact: true };
    return { value: { state: "unavailable" }, exact: false };
  }
  try {
    await executeSafeGit(root, [...SAFE_GIT_PREFIX, "rev-parse", "--is-inside-work-tree"]);
    let head: string | undefined;
    try {
      head = (
        await executeSafeGit(root, [...SAFE_GIT_PREFIX, "rev-parse", "--verify", "HEAD^{commit}"])
      ).trim();
    } catch {
      head = undefined;
    }
    const rawStatus = await executeSafeGit(root, [
      ...SAFE_GIT_PREFIX,
      "status",
      "--porcelain=v1",
      "-z",
      "--untracked-files=all",
      "--no-renames",
      "--ignore-submodules=all"
    ]);
    const status = rawStatus
      .split("\0")
      .filter(Boolean)
      .filter((entry) => !excluded.has(entry.slice(3).replace(/\\/g, "/")))
      .sort(compareCanonicalText);
    return {
      value:
        head === undefined ? { state: "unborn", status } : { state: "available", head, status },
      exact: true
    };
  } catch {
    return { value: { state: "unavailable" }, exact: false };
  }
}

export async function captureRetryState(
  root: string,
  excludedPaths: readonly string[]
): Promise<Result<RetryState>> {
  const reader = await RepositoryReader.create(root);
  if (!reader.ok) return reader;
  const inventory = await reader.value.inventory();
  if (!inventory.ok) return inventory;
  const excluded = new Set(excludedPaths.map((item) => item.replace(/\\/g, "/")));
  const entries: unknown[] = [];
  let exact = true;
  for (const artifact of inventory.value) {
    if (excluded.has(artifact.path)) continue;
    if (artifact.kind === "symbolic-link") {
      try {
        const absolute = path.join(reader.value.root, ...artifact.path.split("/"));
        entries.push({
          path: artifact.path,
          kind: artifact.kind,
          origin: artifact.origin,
          target: (await readlink(absolute)).replace(/\\/g, "/")
        });
      } catch {
        entries.push({ path: artifact.path, kind: artifact.kind, unavailable: true });
        exact = false;
      }
      continue;
    }
    if (artifact.kind.endsWith("-directory")) {
      entries.push({ path: artifact.path, kind: artifact.kind, origin: artifact.origin });
      continue;
    }
    try {
      const absolute = path.join(reader.value.root, ...artifact.path.split("/"));
      const details = await lstat(absolute);
      if (!details.isFile()) {
        entries.push({ path: artifact.path, kind: "unsupported-type" });
        exact = false;
        continue;
      }
      const extension = path.posix.extname(artifact.path.toLowerCase());
      if (
        likelySecret(artifact.path) ||
        BINARY_EXTENSIONS.has(extension) ||
        details.size > CONTENT_LIMIT
      ) {
        entries.push({
          path: artifact.path,
          kind: artifact.kind,
          size: details.size,
          excluded: true
        });
        exact = false;
        continue;
      }
      entries.push({
        path: artifact.path,
        kind: artifact.kind,
        hash: hash(await readFile(absolute))
      });
    } catch {
      entries.push({ path: artifact.path, kind: artifact.kind, unavailable: true });
      exact = false;
    }
  }
  const git = await gitIdentity(reader.value.root, excluded);
  exact = exact && git.exact;
  return success({
    version: 1,
    digest: stableHash({ entries, git: git.value } as never),
    exact
  });
}
