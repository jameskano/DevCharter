import { readFile } from "node:fs/promises";

import { stableJson, type JsonValue } from "@devcharter/core";
import { applyRenderedProposal } from "@devcharter/core/application";
import { renderedProposalSchema, writeApprovalSchema } from "@devcharter/core/rendering";

import type { CliIo } from "./index.js";

export async function runApplyCommand(
  invocation: { format: "human" | "json"; plan: string; approval: string },
  io: CliIo
): Promise<number> {
  try {
    const plan = renderedProposalSchema.parse(JSON.parse(await readFile(invocation.plan, "utf8")));
    const approval = writeApprovalSchema.parse(
      JSON.parse(await readFile(invocation.approval, "utf8"))
    );
    const result = await applyRenderedProposal(io.cwd, plan, approval);
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
  } catch {
    io.stderr("DevCharter: apply input JSON is invalid\n");
    return 2;
  }
}
