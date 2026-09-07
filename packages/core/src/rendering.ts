import { createHash } from "node:crypto";

import { z } from "zod";

import {
  ecosystemProposalSchema,
  plannedFileChangeSchema,
  proposalApprovalSchema,
  type EcosystemProposal,
  type PlannedFileChange
} from "./model.js";
import { approveProposal } from "./project-architect.js";
import { RepositoryReader } from "./repository.js";
import { DevCharterError, failure, success, type Result } from "./results.js";
import { captureRetryState } from "./retry-state.js";
import { stableHash } from "./serialization.js";

export const abstractApprovalSchema = proposalApprovalSchema.extend({
  stage: z.literal("abstract")
});

export const writeApprovalSchema = z
  .object({
    stage: z.literal("write"),
    confirmed: z.literal(true),
    proposalRevision: z.number().int().positive(),
    renderedFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    repositoryFingerprint: z.string().regex(/^[a-f0-9]{64}$/)
  })
  .strict();

export type AbstractApproval = z.infer<typeof abstractApprovalSchema>;
export type WriteApproval = z.infer<typeof writeApprovalSchema>;

const retryStateSchema = z
  .object({
    version: z.literal(1),
    digest: z.string().regex(/^[a-f0-9]{64}$/),
    exact: z.boolean()
  })
  .strict();

export const renderedChangeSchema = plannedFileChangeSchema
  .extend({
    expected: z.enum(["absent", "present"]).optional(),
    baselineHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    contentHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    managedState: z.enum(["new", "adopt", "existing"]).optional(),
    conflictDetail: z.string().trim().min(1).optional()
  })
  .superRefine((change, context) => {
    if (change.action === "create" || change.action === "update") {
      if (
        change.content === undefined ||
        change.contentHash === undefined ||
        change.expected === undefined
      ) {
        context.addIssue({
          code: "custom",
          message: "Writable rendered changes require content, contentHash, and expected state"
        });
      }
    }
    if (
      change.action === "update" &&
      (change.baselineHash === undefined || change.diff === undefined)
    ) {
      context.addIssue({
        code: "custom",
        message: "Rendered updates require baselineHash and diff"
      });
    }
  });

export const renderedProposalSchema = z
  .object({
    formatVersion: z.literal(1),
    stage: z.literal("rendered"),
    adapter: z.string().min(1),
    sourceProposalFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    repositoryFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    revision: z.number().int().positive(),
    renderedFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    proposal: ecosystemProposalSchema,
    changes: z.array(renderedChangeSchema),
    retryState: retryStateSchema,
    receiptContent: z.string().optional()
  })
  .strict();

export type RenderedChange = z.infer<typeof renderedChangeSchema>;
export type RenderedProposal = z.infer<typeof renderedProposalSchema>;

export interface RenderChangeInput {
  proposal: EcosystemProposal;
  change: PlannedFileChange;
  existingContent?: string;
}

export interface EcosystemAdapter {
  id: string;
  renderChange(input: RenderChangeInput): Promise<Result<string>>;
  validateChange?(change: RenderedChange): Promise<string[]>;
}

interface ReceiptEntry {
  path: string;
  adapter: string;
  baselineHash: string;
  managed: true;
}

async function readReceipt(
  reader: RepositoryReader
): Promise<{ entries: ReceiptEntry[]; malformed: boolean }> {
  const exists = await reader.pathExists(".devcharter/managed-files.json");
  if (!exists.ok || !exists.value) return { entries: [], malformed: false };
  const content = await reader.readText(".devcharter/managed-files.json");
  if (!content.ok) return { entries: [], malformed: true };
  try {
    const value = JSON.parse(content.value) as { version?: unknown; files?: unknown };
    if (value.version !== 1 || !Array.isArray(value.files)) return { entries: [], malformed: true };
    const entries = value.files as ReceiptEntry[];
    if (
      entries.some(
        (entry) =>
          typeof entry.path !== "string" ||
          typeof entry.adapter !== "string" ||
          !/^[a-f0-9]{64}$/.test(entry.baselineHash) ||
          entry.managed !== true
      )
    )
      return { entries: [], malformed: true };
    return { entries, malformed: false };
  } catch {
    return { entries: [], malformed: true };
  }
}

function hashText(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function textConvention(value: string): { bom: boolean; eol: "\n" | "\r\n"; terminal: boolean } {
  const body = value.startsWith("\ufeff") ? value.slice(1) : value;
  const crlf = (body.match(/\r\n/g) ?? []).length;
  const lf = (body.match(/(?<!\r)\n/g) ?? []).length;
  return {
    bom: value.startsWith("\ufeff"),
    eol: crlf > lf ? "\r\n" : "\n",
    terminal: /\r?\n$/.test(body)
  };
}

function applyConvention(rendered: string, existing?: string): string {
  const convention =
    existing === undefined
      ? { bom: false, eol: "\n" as const, terminal: true }
      : textConvention(existing);
  let body = rendered
    .replace(/^\ufeff/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n$/, "");
  body = body.replace(/\n/g, convention.eol);
  if (convention.terminal) body += convention.eol;
  return (convention.bom ? "\ufeff" : "") + body;
}

function reviewDiff(path: string, before: string, after: string): string {
  if (before === after) return "";
  const oldLines = before
    .replace(/^\ufeff/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  const newLines = after
    .replace(/^\ufeff/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  return [
    `--- a/${path}`,
    `+++ b/${path}`,
    "@@ full-file review @@",
    ...oldLines.map((line) => `-${line}`),
    ...newLines.map((line) => `+${line}`)
  ].join("\n");
}

function fingerprintPlan(plan: unknown): string {
  return stableHash(plan as never);
}

export function computeRenderedFingerprint(plan: RenderedProposal): string {
  const identity = { ...plan } as Partial<RenderedProposal>;
  delete identity.renderedFingerprint;
  return fingerprintPlan(identity);
}

export async function renderProposal(
  root: string,
  proposalInput: EcosystemProposal,
  approvalInput: AbstractApproval,
  adapter: EcosystemAdapter
): Promise<Result<RenderedProposal>> {
  const proposal = ecosystemProposalSchema.safeParse(proposalInput);
  const approval = abstractApprovalSchema.safeParse(approvalInput);
  if (!proposal.success || !approval.success)
    return failure(new DevCharterError("INVALID_ARGUMENT", "Rendered proposal input is invalid"));
  const approved = await approveProposal(root, proposal.data, {
    confirmed: true,
    proposalRevision: approval.data.proposalRevision,
    proposalFingerprint: approval.data.proposalFingerprint,
    repositoryFingerprint: approval.data.repositoryFingerprint
  });
  if (!approved.ok) return approved;
  const readerResult = await RepositoryReader.create(root);
  if (!readerResult.ok) return readerResult;
  const reader = readerResult.value;
  const receipt = await readReceipt(reader);
  const receiptByPath = new Map(receipt.entries.map((entry) => [entry.path, entry]));
  const changes: RenderedChange[] = [];
  for (const change of approved.value.plannedChanges) {
    if (change.action === "skip" || change.action === "conflict") {
      changes.push(change);
      continue;
    }
    const exists = await reader.pathExists(change.path);
    if (!exists.ok) return exists;
    const existing = exists.value ? await reader.readText(change.path) : undefined;
    if (existing !== undefined && !existing.ok) return existing;
    const rendered =
      change.content ??
      (await adapter.renderChange({
        proposal: approved.value,
        change,
        ...(existing?.ok ? { existingContent: existing.value } : {})
      }));
    if (typeof rendered !== "string" && !rendered.ok) {
      changes.push({ ...change, action: "conflict", conflictDetail: rendered.error.message });
      continue;
    }
    const raw = typeof rendered === "string" ? rendered : rendered.value;
    const content = applyConvention(raw, existing?.ok ? existing.value : undefined);
    const managed = change.ownership === "devcharter-managed";
    const receiptEntry = receiptByPath.get(change.path);
    const managedConflict =
      managed &&
      (receipt.malformed ||
        (!exists.value && receiptEntry !== undefined) ||
        (exists.value && receiptEntry === undefined && change.origin !== "project") ||
        (receiptEntry !== undefined &&
          existing?.ok === true &&
          receiptEntry.baselineHash !== hashText(existing.value)));
    changes.push({
      ...change,
      action: managedConflict ? "conflict" : exists.value ? "update" : "create",
      adapter: adapter.id,
      content,
      contentHash: hashText(content),
      expected: exists.value ? "present" : "absent",
      ...(existing?.ok
        ? {
            baselineHash: hashText(existing.value),
            diff: reviewDiff(change.path, existing.value, content)
          }
        : {}),
      ...(managed && !managedConflict
        ? {
            managedState:
              receiptEntry !== undefined
                ? ("existing" as const)
                : exists.value
                  ? ("adopt" as const)
                  : ("new" as const)
          }
        : {}),
      ...(managedConflict
        ? { conflictDetail: "Managed ownership metadata is missing, malformed, or drifted" }
        : {})
    });
  }
  const managed = changes.filter(
    (change) =>
      change.ownership === "devcharter-managed" &&
      (change.action === "create" || change.action === "update")
  );
  const receiptEntries = new Map(receipt.entries.map((entry) => [entry.path, entry]));
  for (const change of managed)
    receiptEntries.set(change.path, {
      path: change.path,
      adapter: change.adapter!,
      baselineHash: change.contentHash!,
      managed: true
    });
  const receiptContent =
    managed.length === 0
      ? undefined
      : JSON.stringify(
          {
            version: 1,
            files: [...receiptEntries.values()].sort((a, b) => a.path.localeCompare(b.path))
          },
          null,
          2
        ) + "\n";
  const retryState = await captureRetryState(reader.root, [
    ...changes
      .filter((change) => change.action === "create" || change.action === "update")
      .map((change) => change.path),
    ...(receiptContent === undefined ? [] : [".devcharter/managed-files.json"])
  ]);
  if (!retryState.ok) return retryState;
  const identity = {
    formatVersion: 1 as const,
    stage: "rendered" as const,
    adapter: adapter.id,
    sourceProposalFingerprint: approved.value.proposalFingerprint,
    repositoryFingerprint: approved.value.repositoryFingerprint,
    revision: approved.value.revision + 1,
    proposal: { ...approved.value, approved: false },
    changes,
    retryState: retryState.value,
    ...(receiptContent === undefined ? {} : { receiptContent })
  };
  return success(
    renderedProposalSchema.parse({ ...identity, renderedFingerprint: fingerprintPlan(identity) })
  );
}
