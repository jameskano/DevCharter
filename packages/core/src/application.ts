import { createHash } from "node:crypto";

import { approveProposal } from "./project-architect.js";
import { RepositoryReader } from "./repository.js";
import { captureRetryState } from "./retry-state.js";
import {
  failure,
  success,
  DevCharterError,
  type DevCharterErrorRecord,
  type Result
} from "./results.js";
import {
  computeRenderedFingerprint,
  renderedProposalSchema,
  writeApprovalSchema,
  type RenderedChange,
  type RenderedProposal,
  type WriteApproval
} from "./rendering.js";
import { AtomicRepositoryWriter, type AtomicWriteHooks } from "./writer.js";

const RECEIPT_PATH = ".devcharter/managed-files.json";

export interface AppliedChange {
  path: string;
  outcome: "created" | "updated" | "skipped" | "conflict" | "failed" | "not-attempted";
  detail?: string;
}

export interface ApplicationResult {
  outcome: "applied" | "already-applied" | "failed";
  appliedChanges: AppliedChange[];
  changedPaths: string[];
  failures: DevCharterErrorRecord[];
  validation: string[];
}

export interface ApplicationOptions {
  writerHooks?: AtomicWriteHooks;
}

function hashText(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function contentMatches(reader: RepositoryReader, change: RenderedChange): Promise<boolean> {
  if (change.contentHash === undefined) return true;
  const content = await reader.readText(change.path);
  return content.ok && hashText(content.value) === change.contentHash;
}

async function isExactlyAlreadyApplied(
  reader: RepositoryReader,
  plan: RenderedProposal
): Promise<boolean> {
  if (!plan.retryState.exact || plan.changes.some((change) => change.action === "conflict")) {
    return false;
  }
  const writable = new Set(
    plan.changes
      .filter((item) => item.action === "create" || item.action === "update")
      .map((item) => item.path)
  );
  for (const change of plan.changes)
    if (writable.has(change.path) && !(await contentMatches(reader, change))) return false;
  if (plan.receiptContent !== undefined) {
    const receipt = await reader.readText(RECEIPT_PATH);
    if (!receipt.ok || receipt.value !== plan.receiptContent) return false;
  }
  const ignored = [...writable, ...(plan.receiptContent === undefined ? [] : [RECEIPT_PATH])];
  const now = await captureRetryState(reader.root, ignored);
  return now.ok && now.value.exact && now.value.digest === plan.retryState.digest;
}

function invalidApproval(plan: RenderedProposal, approval: WriteApproval): boolean {
  return (
    approval.proposalRevision !== plan.revision ||
    approval.renderedFingerprint !== plan.renderedFingerprint ||
    approval.repositoryFingerprint !== plan.repositoryFingerprint
  );
}

interface PreflightResult {
  failures: DevCharterErrorRecord[];
  outcomes: Map<string, AppliedChange>;
}

async function preflight(
  reader: RepositoryReader,
  plan: RenderedProposal
): Promise<PreflightResult> {
  const failures: DevCharterErrorRecord[] = [];
  const outcomes = new Map<string, AppliedChange>();
  const counts = new Map<string, number>();
  for (const change of plan.changes) {
    const key = process.platform === "win32" ? change.path.toLowerCase() : change.path;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const change of plan.changes) {
    const key = process.platform === "win32" ? change.path.toLowerCase() : change.path;
    if ((counts.get(key) ?? 0) > 1) {
      const error = new DevCharterError(
        "INVALID_ARGUMENT",
        "Rendered plan contains duplicate target paths",
        { path: change.path }
      ).toRecord();
      failures.push(error);
      outcomes.set(change.path, { path: change.path, outcome: "failed", detail: error.message });
      continue;
    }
    if (change.action === "skip") {
      outcomes.set(change.path, { path: change.path, outcome: "skipped" });
      continue;
    }
    if (change.action === "conflict") {
      const error = new DevCharterError(
        "INVALID_ARGUMENT",
        change.conflictDetail ?? "Rendered target has an unresolved conflict",
        { path: change.path }
      ).toRecord();
      failures.push(error);
      outcomes.set(change.path, { path: change.path, outcome: "conflict", detail: error.message });
      continue;
    }
    if (change.action !== "create" && change.action !== "update") continue;
    const exists = await reader.pathExists(change.path);
    if (!exists.ok) {
      failures.push(exists.error);
      outcomes.set(change.path, {
        path: change.path,
        outcome: "failed",
        detail: exists.error.message
      });
      continue;
    }
    if (change.expected === "absent" && exists.value) {
      const error = new DevCharterError(
        "STALE_PROPOSAL",
        "Expected target absence no longer holds",
        {
          path: change.path
        }
      ).toRecord();
      failures.push(error);
      outcomes.set(change.path, { path: change.path, outcome: "failed", detail: error.message });
    }
    if (change.expected === "present") {
      if (!exists.value) {
        const error = new DevCharterError("STALE_PROPOSAL", "Expected target is missing", {
          path: change.path
        }).toRecord();
        failures.push(error);
        outcomes.set(change.path, { path: change.path, outcome: "failed", detail: error.message });
        continue;
      }
      const content = await reader.readText(change.path);
      if (!content.ok) {
        failures.push(content.error);
        outcomes.set(change.path, {
          path: change.path,
          outcome: "failed",
          detail: content.error.message
        });
        continue;
      }
      if (hashText(content.value) !== change.baselineHash) {
        const error = new DevCharterError(
          "STALE_PROPOSAL",
          "Target content drifted after rendering",
          {
            path: change.path
          }
        ).toRecord();
        failures.push(error);
        outcomes.set(change.path, { path: change.path, outcome: "failed", detail: error.message });
      }
    }
  }
  if (plan.receiptContent !== undefined) {
    const receiptExists = await reader.pathExists(RECEIPT_PATH);
    if (!receiptExists.ok) {
      failures.push(receiptExists.error);
      outcomes.set(RECEIPT_PATH, {
        path: RECEIPT_PATH,
        outcome: "failed",
        detail: receiptExists.error.message
      });
      return { failures, outcomes };
    }
    if (!receiptExists.value) return { failures, outcomes };
    const receipt = await reader.readText(RECEIPT_PATH);
    if (!receipt.ok) {
      failures.push(receipt.error);
      outcomes.set(RECEIPT_PATH, {
        path: RECEIPT_PATH,
        outcome: "failed",
        detail: receipt.error.message
      });
      return { failures, outcomes };
    }
    try {
      const parsed = JSON.parse(receipt.value) as { version?: unknown; files?: unknown };
      if (parsed.version !== 1 || !Array.isArray(parsed.files)) throw new Error("invalid receipt");
    } catch {
      const error = new DevCharterError(
        "INVALID_CONFIG",
        "Managed receipt is malformed and will not be replaced",
        { path: RECEIPT_PATH }
      ).toRecord();
      failures.push(error);
      outcomes.set(RECEIPT_PATH, { path: RECEIPT_PATH, outcome: "failed", detail: error.message });
    }
  }
  return { failures, outcomes };
}

function terminalPreflightResults(
  plan: RenderedProposal,
  preflight: PreflightResult
): AppliedChange[] {
  const results = [...plan.changes]
    .sort((left, right) => left.path.localeCompare(right.path))
    .map(
      (change) =>
        preflight.outcomes.get(change.path) ?? {
          path: change.path,
          outcome: "not-attempted" as const
        }
    );
  if (plan.receiptContent !== undefined) {
    results.push(
      preflight.outcomes.get(RECEIPT_PATH) ?? { path: RECEIPT_PATH, outcome: "not-attempted" }
    );
  }
  return results;
}

export async function applyRenderedProposal(
  root: string,
  planInput: RenderedProposal,
  approvalInput: WriteApproval,
  options: ApplicationOptions = {}
): Promise<Result<ApplicationResult>> {
  const plan = renderedProposalSchema.safeParse(planInput);
  const approval = writeApprovalSchema.safeParse(approvalInput);
  if (!plan.success || !approval.success)
    return failure(new DevCharterError("INVALID_ARGUMENT", "Application input is invalid"));
  if (
    computeRenderedFingerprint(plan.data) !== plan.data.renderedFingerprint ||
    invalidApproval(plan.data, approval.data)
  )
    return failure(
      new DevCharterError("APPROVAL_REQUIRED", "Write approval does not match the rendered plan")
    );
  const readerResult = await RepositoryReader.create(root);
  if (!readerResult.ok) return readerResult;
  const current = await approveProposal(root, plan.data.proposal, {
    confirmed: true,
    proposalRevision: plan.data.proposal.revision,
    proposalFingerprint: plan.data.proposal.proposalFingerprint,
    repositoryFingerprint: plan.data.proposal.repositoryFingerprint
  });
  if (!current.ok) {
    if (
      current.error.code === "STALE_PROPOSAL" &&
      (await isExactlyAlreadyApplied(readerResult.value, plan.data))
    )
      return success({
        outcome: "already-applied",
        appliedChanges: [
          ...[...plan.data.changes]
            .sort((left, right) => left.path.localeCompare(right.path))
            .map((change) => ({
              path: change.path,
              outcome: "skipped" as const,
              detail: "Already matches the rendered plan"
            })),
          ...(plan.data.receiptContent === undefined
            ? []
            : [
                {
                  path: RECEIPT_PATH,
                  outcome: "skipped" as const,
                  detail: "Already matches the rendered plan"
                }
              ])
        ],
        changedPaths: [],
        failures: [],
        validation: ["All rendered targets and managed metadata already match"]
      });
    return failure(
      new DevCharterError("STALE_PROPOSAL", "Repository state no longer matches the rendered plan")
    );
  }
  const checked = await preflight(readerResult.value, plan.data);
  if (checked.failures.length > 0)
    return success({
      outcome: "failed",
      appliedChanges: terminalPreflightResults(plan.data, checked),
      changedPaths: [],
      failures: checked.failures,
      validation: ["Preflight failed before the first write"]
    });
  const writerResult = await AtomicRepositoryWriter.create(root, options.writerHooks);
  if (!writerResult.ok) return writerResult;
  const results: AppliedChange[] = [];
  const changedPaths: string[] = [];
  const ordered = [...plan.data.changes].sort((left, right) => left.path.localeCompare(right.path));
  for (let index = 0; index < ordered.length; index += 1) {
    const change = ordered[index]!;
    if (change.action === "skip") {
      results.push({ path: change.path, outcome: "skipped" });
      continue;
    }
    if (change.action !== "create" && change.action !== "update") continue;
    const write = await writerResult.value.writeText(change.path, change.content!);
    if (!write.ok)
      return success({
        outcome: "failed",
        appliedChanges: [
          ...results,
          { path: change.path, outcome: "failed", detail: write.error.message },
          ...ordered.slice(index + 1).map((remaining) => ({
            path: remaining.path,
            outcome: remaining.action === "skip" ? ("skipped" as const) : ("not-attempted" as const)
          })),
          ...(plan.data.receiptContent === undefined
            ? []
            : [{ path: RECEIPT_PATH, outcome: "not-attempted" as const }])
        ],
        changedPaths,
        failures: [write.error],
        validation: ["Application stopped after a partial failure; no rollback is claimed"]
      });
    results.push({
      path: change.path,
      outcome: write.value.action === "create" ? "created" : "updated"
    });
    changedPaths.push(change.path);
  }
  if (plan.data.receiptContent !== undefined) {
    const receipt = await writerResult.value.writeText(RECEIPT_PATH, plan.data.receiptContent);
    if (!receipt.ok)
      return success({
        outcome: "failed",
        appliedChanges: [
          ...results,
          { path: RECEIPT_PATH, outcome: "failed", detail: receipt.error.message }
        ],
        changedPaths,
        failures: [receipt.error],
        validation: ["Managed receipt write failed after target changes; no rollback is claimed"]
      });
    results.push({
      path: RECEIPT_PATH,
      outcome: receipt.value.action === "create" ? "created" : "updated"
    });
    changedPaths.push(RECEIPT_PATH);
  }
  return success({
    outcome: "applied",
    appliedChanges: results,
    changedPaths,
    failures: [],
    validation: ["Rendered content hashes and managed receipt were applied structurally"]
  });
}
