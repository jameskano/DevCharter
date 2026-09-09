import { DevCharterError, stableJson, type JsonValue } from "@devcharter/core";
import { applyRenderedProposal } from "@devcharter/core/application";
import { writeApprovalSchema } from "@devcharter/core/rendering";

import type { CliIo } from "./index.js";
import { extractRenderedPlan, readJsonFile } from "./json-input.js";

export async function runApplyCommand(
  invocation: { format: "human" | "json"; plan: string; approval: string },
  io: CliIo
): Promise<number> {
  const planInput = await readJsonFile(invocation.plan);
  const approvalInput = await readJsonFile(invocation.approval);
  const plan = planInput.ok ? extractRenderedPlan(planInput.value) : planInput;
  const approval = approvalInput.ok
    ? writeApprovalSchema.safeParse(approvalInput.value)
    : undefined;
  if (!plan.ok || !approvalInput.ok || approval?.success !== true) {
    const error = !plan.ok
      ? plan.error
      : !approvalInput.ok
        ? approvalInput.error
        : new DevCharterError(
            "INVALID_ARGUMENT",
            "Write approval input does not match the canonical contract"
          ).toRecord();
    const envelope = {
      formatVersion: 1,
      command: "apply",
      ok: false,
      warnings: [],
      errors: [error]
    };
    if (invocation.format === "json") io.stdout(stableJson(envelope as unknown as JsonValue));
    else io.stdout(`DevCharter apply\nError ${error.code}: ${error.message}\n`);
    return 2;
  }
  try {
    const result = await applyRenderedProposal(io.cwd, plan.value, approval.data);
    const envelope = result.ok
      ? {
          formatVersion: 1,
          command: "apply",
          ok: result.value.outcome !== "failed",
          result: result.value,
          warnings: [],
          errors: []
        }
      : { formatVersion: 1, command: "apply", ok: false, warnings: [], errors: [result.error] };
    if (invocation.format === "json") io.stdout(stableJson(envelope as unknown as JsonValue));
    else if (result.ok) {
      const lines = ["DevCharter apply", `Outcome: ${result.value.outcome}`, "Target outcomes:"];
      for (const change of result.value.appliedChanges) {
        lines.push(
          `- ${change.outcome} ${change.path}${change.detail === undefined ? "" : `: ${change.detail}`}`
        );
      }
      lines.push("Changed paths:");
      for (const path of result.value.changedPaths) lines.push(`- ${path}`);
      if (result.value.changedPaths.length === 0) lines.push("- none");
      lines.push("Validation:");
      for (const validation of result.value.validation) lines.push(`- ${validation}`);
      if (result.value.failures.length > 0) {
        lines.push("Failures:");
        for (const failure of result.value.failures) {
          lines.push(
            `- ${failure.code}${failure.path === undefined ? "" : ` ${failure.path}`}: ${failure.message}`
          );
        }
      }
      io.stdout(lines.join("\n") + "\n");
    } else io.stdout(`DevCharter apply\nError ${result.error.code}: ${result.error.message}\n`);
    return envelope.ok ? 0 : 1;
  } catch (cause) {
    const error = new DevCharterError("INVALID_ARGUMENT", "Apply input could not be processed", {
      cause
    }).toRecord();
    const envelope = {
      formatVersion: 1,
      command: "apply",
      ok: false,
      warnings: [],
      errors: [error]
    };
    if (invocation.format === "json") io.stdout(stableJson(envelope as unknown as JsonValue));
    else io.stdout(`DevCharter apply\nError ${error.code}: ${error.message}\n`);
    return 1;
  }
}
