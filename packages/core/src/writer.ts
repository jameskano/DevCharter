import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, rename, unlink } from "node:fs/promises";
import path from "node:path";

import { DevCharterError, failure, success, type Result } from "./results.js";
import { RepositoryReader, resolveRepositoryPath } from "./repository.js";

export interface AtomicWriteResult {
  path: string;
  action: "create" | "update";
  bytes: number;
}

export interface AtomicWriteHooks {
  beforeRename?: () => Promise<void>;
}

export class AtomicRepositoryWriter {
  readonly root: string;
  readonly hooks: AtomicWriteHooks;

  private constructor(root: string, hooks: AtomicWriteHooks) {
    this.root = root;
    this.hooks = hooks;
  }

  static async create(
    root: string,
    hooks: AtomicWriteHooks = {}
  ): Promise<Result<AtomicRepositoryWriter>> {
    const reader = await RepositoryReader.create(root);
    if (!reader.ok) return reader;
    return success(new AtomicRepositoryWriter(reader.value.root, hooks));
  }

  async writeText(repositoryPath: string, content: string): Promise<Result<AtomicWriteResult>> {
    let stage = "resolve";
    let temporaryPath: string | undefined;
    let fileHandle: Awaited<ReturnType<typeof open>> | undefined;
    let parentCreated: string | undefined;

    try {
      let target = await resolveRepositoryPath(this.root, repositoryPath, { mustExist: false });
      const parent = path.dirname(target);

      stage = "prepare-parent";
      parentCreated = await mkdir(parent, { recursive: true });
      target = await resolveRepositoryPath(this.root, repositoryPath, { mustExist: false });

      let action: AtomicWriteResult["action"] = "create";
      try {
        const targetStatus = await lstat(target);
        if (!targetStatus.isFile()) {
          throw new DevCharterError("ATOMIC_WRITE_FAILED", "Write target must be a file", {
            path: repositoryPath
          });
        }
        action = "update";
      } catch (cause) {
        if (cause instanceof DevCharterError) throw cause;
        if ((cause as NodeJS.ErrnoException).code !== "ENOENT") throw cause;
      }

      stage = "write-temporary";
      temporaryPath = path.join(
        parent,
        "." + path.basename(target) + "." + process.pid + "." + randomUUID() + ".tmp"
      );
      fileHandle = await open(temporaryPath, "wx", 0o600);
      await fileHandle.writeFile(content, "utf8");
      await fileHandle.sync();
      await fileHandle.close();
      fileHandle = undefined;

      stage = "before-rename";
      await this.hooks.beforeRename?.();

      stage = "rename";
      await rename(temporaryPath, target);
      temporaryPath = undefined;

      return success({
        path: repositoryPath.replace(/\\/g, "/"),
        action,
        bytes: Buffer.byteLength(content, "utf8")
      });
    } catch (cause) {
      try {
        await fileHandle?.close();
      } catch {
        // The structured failure below remains authoritative.
      }

      let cleanupSucceeded = true;
      if (temporaryPath !== undefined) {
        try {
          await unlink(temporaryPath);
        } catch (cleanupError) {
          if ((cleanupError as NodeJS.ErrnoException).code !== "ENOENT") cleanupSucceeded = false;
        }
      }

      if (cause instanceof DevCharterError && cause.code !== "ATOMIC_WRITE_FAILED") {
        return failure(cause);
      }
      return failure(
        new DevCharterError("ATOMIC_WRITE_FAILED", "Atomic repository write failed", {
          path: repositoryPath,
          cause,
          details: {
            stage,
            cleanupSucceeded,
            parentCreated: parentCreated !== undefined
          }
        })
      );
    }
  }
}
