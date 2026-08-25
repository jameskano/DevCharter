import type { JsonValue } from "./model.js";

export const DEVCHARTER_ERROR_CODES = [
  "INVALID_ARGUMENT",
  "INVALID_CONFIG",
  "UNSAFE_YAML",
  "PATH_OUTSIDE_ROOT",
  "SYMLINK_ESCAPE",
  "READ_FAILED",
  "INVENTORY_FAILED",
  "ATOMIC_WRITE_FAILED"
] as const;

export type DevCharterErrorCode = (typeof DEVCHARTER_ERROR_CODES)[number];

export interface DevCharterErrorRecord {
  code: DevCharterErrorCode;
  message: string;
  path?: string;
  details?: JsonValue;
}

export class DevCharterError extends Error {
  readonly code: DevCharterErrorCode;
  readonly path?: string;
  readonly details?: JsonValue;

  constructor(
    code: DevCharterErrorCode,
    message: string,
    options: { path?: string; details?: JsonValue; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "DevCharterError";
    this.code = code;
    this.path = options.path;
    this.details = options.details;
  }

  toRecord(): DevCharterErrorRecord {
    return {
      code: this.code,
      message: this.message,
      ...(this.path === undefined ? {} : { path: this.path }),
      ...(this.details === undefined ? {} : { details: this.details })
    };
  }
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: DevCharterErrorRecord };

export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function failure<T = never>(error: DevCharterError): Result<T> {
  return { ok: false, error: error.toRecord() };
}
