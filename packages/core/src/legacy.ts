import type { DevCharterErrorRecord, Result } from "./results.js";
import { success } from "./results.js";
import type { RepositoryReader } from "./repository.js";
import { parseSafeYaml } from "./safe-yaml.js";

export interface LegacyConfigurationFile {
  path: string;
  parsed: boolean;
  migrationRequired: true;
  error?: DevCharterErrorRecord;
}

export interface LegacyConfigurationReport {
  files: LegacyConfigurationFile[];
  migrationRequired: boolean;
}

export async function inspectLegacyConfiguration(
  reader: RepositoryReader
): Promise<Result<LegacyConfigurationReport>> {
  const inventory = await reader.inventory();
  if (!inventory.ok) return inventory;

  const paths = inventory.value
    .map((artifact) => artifact.path)
    .filter((artifactPath) => /^\.ai\/[^/]+\.yaml$/i.test(artifactPath));
  const files: LegacyConfigurationFile[] = [];

  for (const legacyPath of paths) {
    const source = await reader.readText(legacyPath);
    if (!source.ok) {
      files.push({
        path: legacyPath,
        parsed: false,
        migrationRequired: true,
        error: source.error
      });
      continue;
    }

    const parsed = parseSafeYaml(source.value, legacyPath);
    files.push({
      path: legacyPath,
      parsed: parsed.ok,
      migrationRequired: true,
      ...(parsed.ok ? {} : { error: parsed.error })
    });
  }

  return success({ files, migrationRequired: files.length > 0 });
}
