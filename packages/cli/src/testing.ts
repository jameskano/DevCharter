import { createHash } from "node:crypto";
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export interface RepositorySnapshotEntry {
  path: string;
  type: "directory" | "file" | "symbolic-link" | "other";
  size: number;
  hash?: string;
}

export interface TemporaryRepository {
  root: string;
  write(repositoryPath: string, content: string): Promise<void>;
  snapshot(): Promise<RepositorySnapshotEntry[]>;
  cleanup(): Promise<void>;
}

function containedTestPath(root: string, repositoryPath: string): string {
  const candidate = path.resolve(root, ...repositoryPath.split(/[\\/]/));
  const relative = path.relative(root, candidate);
  if (relative === ".." || relative.startsWith(".." + path.sep)) {
    throw new Error("Test fixture path escapes its temporary repository");
  }
  return candidate;
}

export async function snapshotRepository(root: string): Promise<RepositorySnapshotEntry[]> {
  const snapshot: RepositorySnapshotEntry[] = [];

  const visit = async (directory: string, relativeDirectory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));

    for (const entry of entries) {
      const repositoryPath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
      const absolutePath = path.join(directory, entry.name);
      const details = await lstat(absolutePath);
      const type = details.isSymbolicLink()
        ? "symbolic-link"
        : details.isDirectory()
          ? "directory"
          : details.isFile()
            ? "file"
            : "other";
      snapshot.push({
        path: repositoryPath,
        type,
        size: details.size,
        ...(details.isFile()
          ? {
              hash: createHash("sha256")
                .update(await readFile(absolutePath))
                .digest("hex")
            }
          : {})
      });
      if (details.isDirectory()) await visit(absolutePath, repositoryPath);
    }
  };

  await visit(root, "");
  return snapshot;
}

export async function createTemporaryRepository(
  files: Readonly<Record<string, string>> = {}
): Promise<TemporaryRepository> {
  const root = await mkdtemp(path.join(tmpdir(), "devcharter-cli-test-"));

  const write = async (repositoryPath: string, content: string): Promise<void> => {
    const target = containedTestPath(root, repositoryPath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  };

  for (const [repositoryPath, content] of Object.entries(files))
    await write(repositoryPath, content);

  return {
    root,
    write,
    snapshot: () => snapshotRepository(root),
    cleanup: async () => {
      const expectedParent = path.resolve(tmpdir());
      const resolvedRoot = path.resolve(root);
      if (
        path.dirname(resolvedRoot) !== expectedParent ||
        !path.basename(resolvedRoot).startsWith("devcharter-cli-test-")
      ) {
        throw new Error("Refusing to remove an unverified temporary repository");
      }
      await rm(resolvedRoot, { recursive: true, force: true });
    }
  };
}
