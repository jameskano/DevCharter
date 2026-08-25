import type { DevCharterConfig } from "./config.js";
import { parseDevCharterConfig } from "./config.js";
import type { Result } from "./results.js";
import { success } from "./results.js";
import type { RepositoryReader } from "./repository.js";

export * from "./legacy.js";
export * from "./model.js";
export * from "./repository.js";
export * from "./results.js";
export * from "./serialization.js";

export interface OptionalDevCharterConfig {
  present: boolean;
  config?: DevCharterConfig;
}

export async function readOptionalDevCharterConfig(
  reader: RepositoryReader
): Promise<Result<OptionalDevCharterConfig>> {
  const exists = await reader.pathExists(".devcharter.yaml");
  if (!exists.ok) return exists;
  if (!exists.value) return success({ present: false });

  const source = await reader.readText(".devcharter.yaml");
  if (!source.ok) return source;
  const parsed = parseDevCharterConfig(source.value);
  if (!parsed.ok) return parsed;
  return success({ present: true, config: parsed.value });
}
