import { createHash } from "node:crypto";
import path from "node:path";

import type { JsonValue } from "./model.js";

function canonicalize(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)])
  );
}

export function normalizeGeneratedText(value: string): string {
  return `${value.replace(/\r\n?/g, "\n").replace(/\n*$/, "")}\n`;
}

export function stableJson(value: JsonValue): string {
  return normalizeGeneratedText(JSON.stringify(canonicalize(value), null, 2));
}

export function stableHash(value: JsonValue): string {
  return createHash("sha256").update(stableJson(value), "utf8").digest("hex");
}

export function canonicalizePathSet(paths: readonly string[]): string[] {
  return [...new Set(paths.map((value) => value.split(path.sep).join("/")))].sort((left, right) =>
    left.localeCompare(right)
  );
}
