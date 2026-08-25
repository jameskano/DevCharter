import { parseAllDocuments } from "yaml";

import { DevCharterError, failure, success, type Result } from "./results.js";

function messages(errors: readonly { message: string }[]): string[] {
  return errors.map((error) => error.message);
}

export function parseSafeYaml(source: string, path: string): Result<unknown> {
  try {
    const documents = parseAllDocuments(source, {
      customTags: [],
      merge: false,
      prettyErrors: false,
      resolveKnownTags: false,
      schema: "core",
      strict: true,
      stringKeys: true,
      uniqueKeys: true,
      version: "1.2"
    });

    if (documents.length !== 1) {
      return failure(
        new DevCharterError("UNSAFE_YAML", "YAML must contain exactly one document", {
          path,
          details: { documentCount: documents.length }
        })
      );
    }

    const document = documents[0];
    if (document === undefined || document.errors.length > 0 || document.warnings.length > 0) {
      return failure(
        new DevCharterError("UNSAFE_YAML", "YAML could not be parsed safely", {
          path,
          details: {
            errors: messages(document?.errors ?? []),
            warnings: messages(document?.warnings ?? [])
          }
        })
      );
    }

    try {
      return success(document.toJS({ maxAliasCount: 0 }));
    } catch (cause) {
      return failure(
        new DevCharterError("UNSAFE_YAML", "YAML aliases are not allowed", { path, cause })
      );
    }
  } catch (cause) {
    return failure(
      new DevCharterError("UNSAFE_YAML", "YAML could not be parsed safely", { path, cause })
    );
  }
}
