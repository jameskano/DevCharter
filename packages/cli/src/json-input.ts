import { readFile } from "node:fs/promises";

import {
  DevCharterError,
  acceptedDecisionSchema,
  ecosystemProposalSchema,
  failure,
  success,
  type AcceptedDecision,
  type EcosystemProposal,
  type Result
} from "@devcharter/core";
import { renderedProposalSchema, type RenderedProposal } from "@devcharter/core/rendering";

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export async function readJsonFile(path: string): Promise<Result<unknown>> {
  let source: string;
  try {
    source = await readFile(path, "utf8");
  } catch (cause) {
    return failure(
      new DevCharterError("READ_FAILED", "CLI input file could not be read", { path, cause })
    );
  }
  try {
    return success(JSON.parse(source) as unknown);
  } catch (cause) {
    return failure(
      new DevCharterError("INVALID_ARGUMENT", "CLI input file is not valid JSON", { path, cause })
    );
  }
}

export function extractAcceptedDecisions(value: unknown): Result<AcceptedDecision[]> {
  if (!Array.isArray(value)) {
    return failure(
      new DevCharterError(
        "INVALID_ARGUMENT",
        "Decision input must be an array of canonical accepted-decision records"
      )
    );
  }
  const parsed = value.map((item) => acceptedDecisionSchema.safeParse(item));
  if (parsed.some((item) => !item.success)) {
    return failure(
      new DevCharterError(
        "INVALID_ARGUMENT",
        "Decision input does not match the canonical accepted-decision contract"
      )
    );
  }
  return success(parsed.map((item) => item.data!));
}

export function extractProposal(value: unknown): Result<EcosystemProposal> {
  const bare = ecosystemProposalSchema.safeParse(value);
  if (bare.success) return success(bare.data);

  const envelope = objectValue(value);
  const result = objectValue(envelope?.result);
  const candidates = [envelope?.proposal, result?.proposal]
    .map((candidate) => ecosystemProposalSchema.safeParse(candidate))
    .filter((candidate) => candidate.success)
    .map((candidate) => candidate.data);
  if (
    envelope?.ok !== true ||
    (envelope.command !== "new" && envelope.command !== "retrofit") ||
    candidates.length !== 1
  ) {
    return failure(
      new DevCharterError(
        "INVALID_ARGUMENT",
        "Proposal input must be a bare proposal or one successful new/retrofit envelope containing exactly one valid proposal"
      )
    );
  }
  return success(candidates[0]!);
}

export function extractRenderedPlan(value: unknown): Result<RenderedProposal> {
  const bare = renderedProposalSchema.safeParse(value);
  if (bare.success) return success(bare.data);

  const envelope = objectValue(value);
  const result = envelope?.result;
  const resultObject = objectValue(result);
  const candidates = [envelope?.plan, result, resultObject?.plan]
    .map((candidate) => renderedProposalSchema.safeParse(candidate))
    .filter((candidate) => candidate.success)
    .map((candidate) => candidate.data);
  if (envelope?.ok !== true || envelope.command !== "render" || candidates.length !== 1) {
    return failure(
      new DevCharterError(
        "INVALID_ARGUMENT",
        "Plan input must be a bare rendered plan or one successful render envelope containing exactly one valid plan"
      )
    );
  }
  return success(candidates[0]!);
}
