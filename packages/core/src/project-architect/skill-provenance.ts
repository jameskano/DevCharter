import type { ArtifactRecord, Evidence } from "../model.js";

const LOCK_PATHS = new Set(["skills-lock.json", ".agents/skills-lock.json"]);

interface SkillProvenanceResult {
  artifacts: ArtifactRecord[];
  uncertainties: Evidence[];
}

function skillDirectory(repositoryPath: string): string | undefined {
  return repositoryPath.match(/^(\.agents\/skills\/[^/]+)(?:\/|$)/i)?.[1];
}

function explicitLockedDirectories(text: string): { directories: Set<string>; valid: boolean } {
  try {
    const parsed = JSON.parse(text) as { version?: unknown; skills?: unknown };
    if (
      parsed.version !== 1 ||
      parsed.skills === null ||
      typeof parsed.skills !== "object" ||
      Array.isArray(parsed.skills)
    ) {
      return { directories: new Set(), valid: false };
    }
    const directories = new Set<string>();
    for (const [identity, value] of Object.entries(parsed.skills as Record<string, unknown>)) {
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return { directories: new Set(), valid: false };
      }
      const entry = value as Record<string, unknown>;
      if (typeof entry.path !== "string" || typeof entry.source !== "string") {
        return { directories: new Set(), valid: false };
      }
      const normalized = entry.path.replace(/\\/g, "/").replace(/\/$/, "");
      const expectedIdentity = normalized.match(/^\.agents\/skills\/([^/]+)$/i)?.[1];
      if (expectedIdentity !== identity || entry.source.trim() === "") {
        return { directories: new Set(), valid: false };
      }
      directories.add(normalized);
    }
    return { directories, valid: true };
  } catch {
    return { directories: new Set(), valid: false };
  }
}

export async function classifySkillProvenance(
  artifacts: readonly ArtifactRecord[],
  readText: (repositoryPath: string) => Promise<string | undefined>
): Promise<SkillProvenanceResult> {
  const thirdPartyDirectories = new Set<string>();
  const uncertainties: Evidence[] = [];

  for (const artifact of artifacts) {
    const directory = skillDirectory(artifact.path);
    if (directory === undefined || !/\/package\.json$/i.test(artifact.path)) continue;
    const text = await readText(artifact.path);
    if (text === undefined) continue;
    try {
      const manifest = JSON.parse(text) as { devcharterOrigin?: unknown };
      if (manifest.devcharterOrigin === "third-party") thirdPartyDirectories.add(directory);
    } catch {
      // Invalid package metadata cannot establish third-party origin.
    }
  }

  for (const artifact of artifacts) {
    if (!LOCK_PATHS.has(artifact.path.toLowerCase())) continue;
    const text = await readText(artifact.path);
    if (text === undefined) continue;
    const lock = explicitLockedDirectories(text);
    if (!lock.valid) {
      uncertainties.push({
        source: artifact.path,
        detail:
          "Skill provenance lock is invalid or ambiguous; local skills remain project-authored"
      });
      continue;
    }
    for (const directory of lock.directories) {
      if (artifacts.some((candidate) => skillDirectory(candidate.path) === directory)) {
        thirdPartyDirectories.add(directory);
      } else {
        uncertainties.push({
          source: artifact.path,
          detail: `Locked skill path does not map to one local skill directory: ${directory}`
        });
      }
    }
  }

  return {
    artifacts: artifacts.map((artifact) => {
      const directory = skillDirectory(artifact.path);
      if (directory === undefined) return artifact;
      if (thirdPartyDirectories.has(directory)) {
        return {
          ...artifact,
          origin: "third-party",
          ownership: "third-party",
          nativeTarget: "codex-skill"
        };
      }
      return {
        ...artifact,
        origin: "project",
        ownership: "project",
        nativeTarget: "codex-skill"
      };
    }),
    uncertainties
  };
}
