import { parseArgs } from "node:util";

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
  command: "inspect" | "validate";
  ok: boolean;
  result?: T;
  warnings: string[];
  errors: DevCharterErrorRecord[];
}

type ParsedInvocation =
  | { kind: "help"; command?: "inspect" | "validate" }
  | { kind: "version" }
  | { kind: "command"; command: "inspect" | "validate"; format: "human" | "json" }
  | { kind: "error"; message: string };

const HELP = normalizeGeneratedText(
  [
    "DevCharter " + DEVCHARTER_VERSION,
    "",
    "Usage:",
    "  devcharter inspect [--format human|json]",
    "  devcharter validate [--format human|json]",
    "  devcharter --help",
    "  devcharter --version",
    "",
    "Commands:",
    "  inspect   Inventory the current working directory without writing",
    "  validate  Validate DevCharter configuration and legacy YAML without writing"
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
      return { kind: "error", message: "Expected inspect or validate" };
    }
    if (parsed.positionals.length > 1) {
      return {
        kind: "error",
        message:
          "Positional repository arguments are not supported; commands use the current directory"
      };
    }
    if (command !== "inspect" && command !== "validate") {
      return { kind: "error", message: "Unknown command: " + command };
    }
    if (parsed.values.help === true) return { kind: "help", command };

    const format = parsed.values.format ?? "human";
    if (format !== "human" && format !== "json") {
      return { kind: "error", message: "--format must be human or json" };
    }
    return { kind: "command", command, format };
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

function emit<T>(envelope: CliEnvelope<T>, format: "human" | "json", io: CliIo): void {
  if (format === "json") {
    io.stdout(stableJson(envelope as unknown as JsonValue));
  } else if (envelope.command === "inspect") {
    io.stdout(humanInspect(envelope as CliEnvelope<InspectResult>));
  } else {
    io.stdout(humanValidate(envelope as CliEnvelope<ValidationResult>));
  }
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
    const envelope: CliEnvelope<never> = {
      formatVersion: 1,
      command: invocation.command,
      ok: false,
      warnings: [],
      errors: [readerResult.error]
    };
    emit(envelope, invocation.format, io);
    return 1;
  }

  if (invocation.command === "inspect") {
    const envelope = await inspect(readerResult.value);
    emit(envelope, invocation.format, io);
    return envelope.ok ? 0 : 1;
  }

  const envelope = await validate(readerResult.value);
  emit(envelope, invocation.format, io);
  return envelope.ok ? 0 : 1;
}
