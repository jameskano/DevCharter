import { z } from "zod";

import { DevCharterError, failure, success, type Result } from "./results.js";
import { parseSafeYaml } from "./safe-yaml.js";

const verificationCommandSchema = z
  .object({
    name: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9:_-]*$/),
    command: z.string().regex(/^[^\0\r\n]+$/)
  })
  .strict();

export const devCharterConfigSchema = z
  .object({
    version: z.literal(1),
    verificationCommands: z.array(verificationCommandSchema).optional()
  })
  .strict()
  .superRefine((config, context) => {
    const seen = new Set<string>();
    for (const [index, verificationCommand] of (config.verificationCommands ?? []).entries()) {
      if (seen.has(verificationCommand.name)) {
        context.addIssue({
          code: "custom",
          path: ["verificationCommands", index, "name"],
          message: "Verification command names must be unique"
        });
      }
      seen.add(verificationCommand.name);
    }
  });

export type DevCharterConfig = z.infer<typeof devCharterConfigSchema>;

export function parseDevCharterConfig(
  source: string,
  path = ".devcharter.yaml"
): Result<DevCharterConfig> {
  const yaml = parseSafeYaml(source, path);
  if (!yaml.ok) return yaml;

  const parsed = devCharterConfigSchema.safeParse(yaml.value);
  if (!parsed.success) {
    return failure(
      new DevCharterError("INVALID_CONFIG", "DevCharter configuration is invalid", {
        path,
        details: {
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        }
      })
    );
  }

  return success(parsed.data);
}
