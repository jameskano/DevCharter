import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";

import { codexAdapter } from "@devcharter/adapter-codex";

import {
  RepositoryReader,
  inspectLegacyConfiguration,
  normalizeGeneratedText,
  readOptionalDevCharterConfig,
  stableJson,
  type ArtifactRecord,
  type DevCharterErrorRecord,
  type JsonValue,
  type ProjectFact,
  type ValidationResult
} from "@devcharter/core/read-only";
import {
  runProjectArchitect,
  type ProjectArchitectResult
} from "@devcharter/core/project-architect";
import type { Mode, Scope } from "@devcharter/core/read-only";
import {
  abstractApprovalSchema,
  renderProposal,
  type RenderedProposal
} from "@devcharter/core/rendering";

export const DEVCHARTER_VERSION = "0.1.0";

export interface CliIo {
  cwd: string;
  stdout(value: string): void;
  stderr(value: string): void;
}

interface InspectResult {
  facts: ProjectFact[];
  artifacts: ArtifactRecord[];
}

interface CliEnvelope<T> {
  formatVersion: 1;
  command: "inspect" | "validate" | "render" | "apply" | Mode;
  ok: boolean;
  result?: T;
  warnings: string[];
  errors: DevCharterErrorRecord[];
}

type ParsedInvocation =
  | { kind: "help"; command?: "inspect" | "validate" | "render" | "apply" | Mode }
  | { kind: "version" }
  | {
      kind: "command";
      command: "inspect" | "validate" | Mode;
      format: "human" | "json";
      scope?: Scope;
    }
  | {
      kind: "render";
      format: "human" | "json";
      proposal: string;
      approval: string;
      adapter: "codex";
    }
  | { kind: "apply"; format: "human" | "json"; plan: string; approval: string }
  | { kind: "error"; message: string };

const HELP = normalizeGeneratedText(
  [
    "DevCharter " + DEVCHARTER_VERSION,
    "",
    "Usage:",
    "  devcharter new [--scope full|governance|engineering|ai] [--format human|json]",
    "  devcharter retrofit [--scope full|governance|engineering|ai] [--format human|json]",
    "  devcharter audit [--scope full|governance|engineering|ai] [--format human|json]",
    "  devcharter inspect [--format human|json]",
    "  devcharter validate [--format human|json]",
    "  devcharter render --proposal <file> --approval <file> --adapter codex [--format human|json]",
    "  devcharter apply --plan <file> --approval <file> [--format human|json]",
    "  devcharter --help",
    "  devcharter --version",
    "",
    "Commands:",
    "  new       Analyze a new project and return an unapproved proposal without writing",
    "  retrofit  Analyze an established project and return an unapproved proposal without writing",
    "  audit     Audit the selected scope without writing",
    "  inspect   Inventory the current working directory without writing",
    "  validate  Validate DevCharter configuration and legacy YAML without writing",
    "  render    Produce a reviewable rendered plan without writing",
    "  apply     Apply an exactly approved rendered plan"
  ].join("\n")
);

function parseInvocation(args: readonly string[]): ParsedInvocation {
  try {
    const parsed = parseArgs({
      args: [...args],
      allowPositionals: true,
      strict: true,
      options: {
        format: { type: "string" },
        scope: { type: "string" },
        proposal: { type: "string" },
        approval: { type: "string" },
        adapter: { type: "string" },
        plan: { type: "string" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" }
      }
    });
    const command = parsed.positionals[0];

    if (parsed.values.version === true) {
      if (parsed.positionals.length > 0 || parsed.values.help === true) {
        return { kind: "error", message: "--version does not accept a command or other action" };
      }
      return { kind: "version" };
    }

    if (parsed.positionals.length === 0) {
      if (parsed.values.help === true) return { kind: "help" };
      return {
        kind: "error",
        message: "Expected new, retrofit, audit, inspect, validate, render, or apply"
      };
    }
    if (parsed.positionals.length > 1) {
      return {
        kind: "error",
        message:
          "Positional repository arguments are not supported; commands use the current directory"
      };
    }
    if (
      command !== "new" &&
      command !== "retrofit" &&
      command !== "audit" &&
      command !== "inspect" &&
      command !== "validate" &&
      command !== "render" &&
      command !== "apply"
    ) {
      return { kind: "error", message: "Unknown command: " + command };
    }
    if (parsed.values.help === true) return { kind: "help", command };

    const format = parsed.values.format ?? "human";
    if (format !== "human" && format !== "json") {
      return { kind: "error", message: "--format must be human or json" };
    }
    if (command === "render") {
      if (
        parsed.values.proposal === undefined ||
        parsed.values.approval === undefined ||
        parsed.values.adapter !== "codex"
      )
        return {
          kind: "error",
          message: "render requires --proposal, --approval, and --adapter codex"
        };
      return {
        kind: "render",
        format,
        proposal: parsed.values.proposal,
        approval: parsed.values.approval,
        adapter: "codex"
      };
    }
    if (command === "apply") {
      if (parsed.values.plan === undefined || parsed.values.approval === undefined)
        return { kind: "error", message: "apply requires --plan and --approval" };
      return { kind: "apply", format, plan: parsed.values.plan, approval: parsed.values.approval };
    }
    if ((command === "inspect" || command === "validate") && parsed.values.scope !== undefined) {
      return { kind: "error", message: "--scope is supported only by new, retrofit, and audit" };
    }
    const scope = parsed.values.scope;
    if (
      scope !== undefined &&
      scope !== "full" &&
      scope !== "governance" &&
      scope !== "engineering" &&
      scope !== "ai"
    ) {
      return { kind: "error", message: "--scope must be full, governance, engineering, or ai" };
    }
    return { kind: "command", command, format, ...(scope === undefined ? {} : { scope }) };
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Invalid command arguments"
    };
  }
}

async function inspect(reader: RepositoryReader): Promise<CliEnvelope<InspectResult>> {
  const inventory = await reader.inventory();
  if (!inventory.ok) {
    return {
      formatVersion: 1,
      command: "inspect",
      ok: false,
      warnings: [],
      errors: [inventory.error]
    };
  }

  const facts: ProjectFact[] = [
    {
      key: "repository.root",
      value: ".",
      state: "confirmed",
      evidence: [{ source: "process.cwd" }]
    },
    {
      key: "repository.artifactCount",
      value: inventory.value.length,
      state: "confirmed",
      evidence: [{ source: "repository inventory" }]
    }
  ];
  return {
    formatVersion: 1,
    command: "inspect",
    ok: true,
    result: { facts, artifacts: inventory.value },
    warnings: [],
    errors: []
  };
}

async function validate(reader: RepositoryReader): Promise<CliEnvelope<ValidationResult>> {
  const [configuration, legacy] = await Promise.all([
    readOptionalDevCharterConfig(reader),
    inspectLegacyConfiguration(reader)
  ]);
  const warnings: string[] = [];
  const errors: DevCharterErrorRecord[] = [];
  const checksRun: ValidationResult["checksRun"] = [];

  if (configuration.ok) {
    checksRun.push({
      name: "configuration",
      outcome: "pass",
      detail: configuration.value.present
        ? "Validated .devcharter.yaml"
        : "No .devcharter.yaml present"
    });
  } else {
    checksRun.push({ name: "configuration", outcome: "fail", detail: configuration.error.message });
    errors.push(configuration.error);
  }

  if (legacy.ok) {
    for (const file of legacy.value.files) {
      warnings.push("Explicit migration required for " + file.path);
      if (file.error !== undefined) errors.push(file.error);
    }
    checksRun.push({
      name: "legacy-configuration",
      outcome: legacy.value.files.some((file) => !file.parsed)
        ? "fail"
        : legacy.value.migrationRequired
          ? "warning"
          : "pass",
      detail: legacy.value.migrationRequired
        ? "Legacy .ai YAML detected"
        : "No legacy .ai YAML detected"
    });
  } else {
    checksRun.push({
      name: "legacy-configuration",
      outcome: "fail",
      detail: legacy.error.message
    });
    errors.push(legacy.error);
  }

  const outcome: ValidationResult["outcome"] =
    errors.length > 0 ? "fail" : warnings.length > 0 ? "warning" : "pass";
  const result: ValidationResult = {
    outcome,
    checksRun,
    warnings,
    failures: errors.map((error) => error.message),
    changedPaths: [],
    skippedChecks: []
  };
  return {
    formatVersion: 1,
    command: "validate",
    ok: outcome !== "fail",
    result,
    warnings,
    errors
  };
}

function humanInspect(envelope: CliEnvelope<InspectResult>): string {
  const lines = ["DevCharter inspect"];
  if (envelope.result !== undefined) {
    lines.push("Artifacts: " + envelope.result.artifacts.length);
    for (const artifact of envelope.result.artifacts) {
      lines.push("- " + artifact.path + " [" + artifact.kind + "; " + artifact.origin + "]");
    }
  }
  for (const error of envelope.errors) lines.push("Error " + error.code + ": " + error.message);
  return normalizeGeneratedText(lines.join("\n"));
}

function humanValidate(envelope: CliEnvelope<ValidationResult>): string {
  const lines = ["DevCharter validate"];
  if (envelope.result !== undefined) {
    lines.push("Outcome: " + envelope.result.outcome);
    lines.push("Checks:");
    for (const check of envelope.result.checksRun) {
      lines.push(
        "- " + check.name + ": " + check.outcome + (check.detail ? " — " + check.detail : "")
      );
    }
  }
  if (envelope.warnings.length > 0) {
    lines.push("Warnings:");
    for (const warning of envelope.warnings) lines.push("- " + warning);
  }
  if (envelope.errors.length > 0) {
    lines.push("Errors:");
    for (const error of envelope.errors) lines.push("- " + error.code + ": " + error.message);
  }
  return normalizeGeneratedText(lines.join("\n"));
}

function humanProjectArchitect(envelope: CliEnvelope<ProjectArchitectResult>): string {
  const lines = [`DevCharter ${envelope.command}`];
  if (envelope.result !== undefined) {
    const result = envelope.result;
    lines.push(`Scope: ${result.scope}`);
    lines.push(`Summary: ${result.summary}`);
    lines.push(
      `Recommendation: ${result.recommendation.recommendedMode} (${result.recommendation.confidence} confidence)`
    );
    if (result.recommendation.uncertainty !== undefined) {
      lines.push(`Recommendation uncertainty: ${result.recommendation.uncertainty}`);
    }
    for (const signal of result.recommendation.signals) {
      lines.push(
        `- signal ${signal.kind} [${signal.strength}; ${signal.confidence} confidence]: ${signal.evidence
          .map((item) => item.source)
          .join(", ")}`
      );
    }
    lines.push(`Repository fingerprint: ${result.repositoryFingerprint}`);
    lines.push(
      `Fingerprint inputs: ${result.fingerprintInputs.includedPaths.length} included, ${result.fingerprintInputs.excludedPaths.length} excluded`
    );
    lines.push(`Semantic inspection: ${result.semanticallyInspectedPaths.length} path(s)`);
    lines.push(`Facts: ${result.facts.length}`);
    for (const fact of result.facts) {
      lines.push(
        `- ${fact.key} [${fact.state}${fact.confidence === undefined ? "" : `; ${fact.confidence} confidence`}]: ${JSON.stringify(fact.value)}`
      );
      lines.push(`  Evidence: ${fact.evidence.map((item) => item.source).join(", ")}`);
    }
    lines.push(`Findings: ${result.findings.length}`);
    for (const finding of result.findings) {
      lines.push(
        `- ${finding.code} [${finding.impact}; ${finding.confidence} confidence]: ${finding.summary}`
      );
      lines.push(`  Evidence: ${finding.evidence.map((item) => item.source).join(", ")}`);
      if (finding.uncertainty !== undefined) {
        lines.push(`  Uncertainty: ${finding.uncertainty}`);
      }
      lines.push(`  Recommended action: ${finding.recommendedAction}`);
    }
    lines.push(`Assumptions: ${result.assumptions.length}`);
    for (const assumption of result.assumptions) lines.push(`- ${assumption.summary}`);
    lines.push(`Questions: ${result.questions.length}`);
    for (const question of result.questions) {
      lines.push(`- ${question.id}: ${question.question}`);
      lines.push(`  Context: ${question.context}`);
      lines.push(`  Reason: ${question.reason}`);
      if (question.recommendedDefault !== undefined) {
        lines.push(`  Recommended default: ${JSON.stringify(question.recommendedDefault)}`);
      }
    }
    lines.push(`Critical journeys: ${result.criticalJourneys.length}`);
    for (const journey of result.criticalJourneys) {
      lines.push(`- ${journey.id}: ${journey.summary}`);
      lines.push(`  Evidence: ${journey.evidence.map((item) => item.source).join(", ")}`);
      lines.push(`  Verification: ${journey.verification}`);
    }
    lines.push(`Considered components: ${result.consideredComponents.length}`);
    for (const component of result.consideredComponents) {
      lines.push(`- ${component.decision} ${component.component}: ${component.reason}`);
    }
    if (result.proposal !== undefined) {
      lines.push(`Proposal revision: ${result.proposal.revision} (unapproved)`);
      lines.push(`Proposal fingerprint: ${result.proposal.proposalFingerprint}`);
      lines.push("Application: render and separately approve this proposal before apply");
    } else {
      lines.push("Proposal: none");
    }
    lines.push(`Planned changes: ${result.plannedChanges.length}`);
    for (const change of result.plannedChanges) {
      lines.push(`- ${change.action} ${change.path}: ${change.reason}`);
    }
    lines.push(`Preserved paths: ${result.preservedPaths.length}`);
    for (const preservedPath of result.preservedPaths.slice(0, 20)) {
      lines.push(`- ${preservedPath}`);
    }
    if (result.preservedPaths.length > 20) {
      lines.push(
        `- ${result.preservedPaths.length - 20} additional preserved path(s) omitted; use JSON for the complete list`
      );
    }
    lines.push(`Conflicts: ${result.conflicts.length}`);
    for (const conflict of result.conflicts) {
      lines.push(`- ${conflict.code}: ${conflict.summary}`);
    }
    lines.push(`Risks: ${result.risks.length}`);
    for (const risk of result.risks) lines.push(`- ${risk}`);
    lines.push(`Validation: ${result.validation.length}`);
    for (const validation of result.validation) lines.push(`- ${validation}`);
    lines.push(`Deferred work: ${result.deferredWork.length}`);
    for (const deferred of result.deferredWork) lines.push(`- ${deferred}`);
    lines.push("Applied changes: 0");
  }
  for (const error of envelope.errors) lines.push(`Error ${error.code}: ${error.message}`);
  return normalizeGeneratedText(lines.join("\n"));
}

function emit<T>(envelope: CliEnvelope<T>, format: "human" | "json", io: CliIo): void {
  if (format === "json") {
    io.stdout(stableJson(envelope as unknown as JsonValue));
  } else if (envelope.command === "inspect") {
    io.stdout(humanInspect(envelope as CliEnvelope<InspectResult>));
  } else if (envelope.command === "validate") {
    io.stdout(humanValidate(envelope as CliEnvelope<ValidationResult>));
  } else {
    io.stdout(humanProjectArchitect(envelope as CliEnvelope<ProjectArchitectResult>));
  }
}

async function readJsonInput(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

function emitLifecycle<T>(envelope: CliEnvelope<T>, format: "human" | "json", io: CliIo): void {
  if (format === "json") {
    io.stdout(stableJson(envelope as unknown as JsonValue));
    return;
  }
  if (!envelope.ok) {
    io.stdout(
      normalizeGeneratedText(
        envelope.errors.map((error) => `Error ${error.code}: ${error.message}`).join("\n")
      )
    );
    return;
  }
  const result = envelope.result as {
    renderedFingerprint?: string;
    outcome?: string;
    changedPaths?: string[];
    changes?: RenderedProposal["changes"];
  };
  const lines = [`DevCharter ${envelope.command}`];
  if (result.renderedFingerprint !== undefined) {
    lines.push(`Rendered fingerprint: ${result.renderedFingerprint}`, "Targets:");
    for (const change of [...(result.changes ?? [])].sort((left, right) =>
      left.path.localeCompare(right.path)
    )) {
      lines.push(
        `- ${change.action} ${change.path}`,
        `  Purpose: ${change.purpose}`,
        `  Reason: ${change.reason}`,
        `  Origin: ${change.origin}`,
        `  Ownership: ${change.ownership ?? "unspecified"}`
      );
      if (change.action === "create" || change.action === "update") {
        lines.push(
          `  Adapter: ${change.adapter}`,
          `  Expected state: ${change.expected}`,
          `  Baseline hash: ${change.baselineHash ?? "none"}`,
          `  Content hash: ${change.contentHash}`,
          "  Validation expectations:"
        );
        for (const expectation of change.validationExpectations) {
          lines.push(`    - ${expectation}`);
        }
        lines.push(
          change.action === "update"
            ? `  Deterministic diff JSON: ${JSON.stringify(change.diff)}`
            : `  Proposed content JSON: ${JSON.stringify(change.content)}`
        );
      } else if (change.conflictDetail !== undefined) {
        lines.push(`  Conflict detail: ${change.conflictDetail}`);
      }
    }
    lines.push("Review this complete plan and provide a write-stage approval before apply.");
  }
  if (result.outcome !== undefined)
    lines.push(
      `Outcome: ${result.outcome}`,
      `Changed paths: ${(result.changedPaths ?? []).length}`
    );
  io.stdout(normalizeGeneratedText(lines.join("\n")));
}

export async function runCli(args: readonly string[], io: CliIo): Promise<number> {
  const invocation = parseInvocation(args);
  if (invocation.kind === "error") {
    io.stderr(normalizeGeneratedText("DevCharter: " + invocation.message));
    return 2;
  }
  if (invocation.kind === "help") {
    io.stdout(HELP);
    return 0;
  }
  if (invocation.kind === "version") {
    io.stdout(normalizeGeneratedText("devcharter " + DEVCHARTER_VERSION));
    return 0;
  }

  const readerResult = await RepositoryReader.create(io.cwd);
  if (!readerResult.ok) {
    const command = invocation.kind === "command" ? invocation.command : invocation.kind;
    const envelope: CliEnvelope<never> = {
      formatVersion: 1,
      command,
      ok: false,
      warnings: [],
      errors: [readerResult.error]
    };
    if (command === "render" || command === "apply") emitLifecycle(envelope, invocation.format, io);
    else emit(envelope, invocation.format, io);
    return 1;
  }

  if (invocation.kind === "render") {
    try {
      const proposal = await readJsonInput(invocation.proposal);
      const approval = abstractApprovalSchema.parse(await readJsonInput(invocation.approval));
      const result = await renderProposal(io.cwd, proposal as never, approval, codexAdapter);
      const envelope: CliEnvelope<RenderedProposal> = result.ok
        ? {
            formatVersion: 1,
            command: "render",
            ok: true,
            result: result.value,
            warnings: [],
            errors: []
          }
        : { formatVersion: 1, command: "render", ok: false, warnings: [], errors: [result.error] };
      emitLifecycle(envelope, invocation.format, io);
      return envelope.ok ? 0 : 1;
    } catch {
      io.stderr(normalizeGeneratedText("DevCharter: render input JSON is invalid"));
      return 2;
    }
  }

  if (invocation.kind === "apply") {
    const module = await import("./apply-command.js");
    return module.runApplyCommand(invocation, io);
  }

  if (invocation.command === "inspect") {
    const envelope = await inspect(readerResult.value);
    emit(envelope, invocation.format, io);
    return envelope.ok ? 0 : 1;
  }

  if (
    invocation.command === "new" ||
    invocation.command === "retrofit" ||
    invocation.command === "audit"
  ) {
    const result = await runProjectArchitect(io.cwd, {
      mode: invocation.command,
      ...(invocation.scope === undefined ? {} : { scope: invocation.scope })
    });
    const envelope: CliEnvelope<ProjectArchitectResult> = result.ok
      ? {
          formatVersion: 1,
          command: invocation.command,
          ok: true,
          result: result.value,
          warnings: result.value.fingerprintInputs.excludedPaths
            .filter((item) => item.uncertainty !== undefined)
            .map((item) => `${item.path}: ${item.uncertainty}`),
          errors: []
        }
      : {
          formatVersion: 1,
          command: invocation.command,
          ok: false,
          warnings: [],
          errors: [result.error]
        };
    emit(envelope, invocation.format, io);
    return envelope.ok ? 0 : 1;
  }

  const envelope = await validate(readerResult.value);
  emit(envelope, invocation.format, io);
  return envelope.ok ? 0 : 1;
}
