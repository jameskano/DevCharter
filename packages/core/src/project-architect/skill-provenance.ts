import type { ArtifactRecord, Evidence } from "../model.js";

const LOCK_PATHS = new Set(["skills-lock.json", ".agents/skills-lock.json"]);
const INSTALLER_HASH = /^[a-f0-9]{64}$/i;

interface SkillProvenanceResult {
  artifacts: ArtifactRecord[];
  uncertainties: Evidence[];
}

function skillDirectory(repositoryPath: string): string | undefined {
  return repositoryPath.match(/^(\.agents\/skills\/[^/]+)(?:\/|$)/i)?.[1];
}

interface ParsedLock {
  directories: Map<string, string>;
  uncertainties: string[];
}

function normalizedInstallerIdentity(skillPath: string): string | undefined {
  const portable = skillPath.replace(/\\/g, "/");
  if (
    portable === "" ||
    portable.startsWith("/") ||
    /^[a-z]:\//i.test(portable) ||
    /^[a-z][a-z0-9+.-]*:/i.test(portable) ||
    portable.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    return undefined;
  }
  const segments = portable.split("/");
  if (segments.at(-1)?.toLowerCase() !== "skill.md" || segments.length < 2) return undefined;
  return segments.at(-2);
}

function explicitLockedDirectories(text: string): ParsedLock {
  try {
    const parsed = JSON.parse(text) as { version?: unknown; skills?: unknown };
    if (
      parsed.version !== 1 ||
      parsed.skills === null ||
      typeof parsed.skills !== "object" ||
      Array.isArray(parsed.skills)
    ) {
      return {
        directories: new Map(),
        uncertainties: ["Skill provenance lock has an invalid version or skills collection"]
      };
    }
    const candidates: Array<{ identity: string; directory: string }> = [];
    const uncertainties: string[] = [];
    for (const [identity, value] of Object.entries(parsed.skills as Record<string, unknown>)) {
      if (
        identity.trim() === "" ||
        identity === "." ||
        identity === ".." ||
        identity.includes("/") ||
        identity.includes("\\")
      ) {
        uncertainties.push(`Skill provenance identity ${identity} is not one path segment`);
        continue;
      }
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        uncertainties.push(`Skill provenance entry ${identity} is not an object`);
        continue;
      }
      const entry = value as Record<string, unknown>;
      if (typeof entry.source !== "string" || entry.source.trim() === "") {
        uncertainties.push(`Skill provenance entry ${identity} has no nonblank source`);
        continue;
      }

      const directory = `.agents/skills/${identity}`;
      if (Object.hasOwn(entry, "path")) {
        const canonicalPath =
          typeof entry.path === "string"
            ? entry.path.replace(/\\/g, "/").replace(/\/$/, "")
            : undefined;
        if (canonicalPath !== directory) {
          uncertainties.push(
            `Skill provenance entry ${identity} does not map exactly to ${directory}`
          );
          continue;
        }
      } else {
        if (typeof entry.sourceType !== "string" || entry.sourceType.trim() === "") {
          uncertainties.push(`Installer skill provenance entry ${identity} has no sourceType`);
          continue;
        }
        if (typeof entry.computedHash !== "string" || !INSTALLER_HASH.test(entry.computedHash)) {
          uncertainties.push(`Installer skill provenance entry ${identity} has an invalid hash`);
          continue;
        }
        if (entry.skillPath !== undefined) {
          if (typeof entry.skillPath !== "string") {
            uncertainties.push(`Installer skill provenance entry ${identity} has an invalid path`);
            continue;
          }
          const pathIdentity = normalizedInstallerIdentity(entry.skillPath);
          if (pathIdentity !== identity) {
            uncertainties.push(
              `Installer skill provenance entry ${identity} has an escaping or mismatched path`
            );
            continue;
          }
        }
      }

      candidates.push({ identity, directory });
    }

    const collisions = new Set<string>();
    const byCanonicalTarget = new Map<string, string[]>();
    for (const candidate of candidates) {
      const key = candidate.directory.toLowerCase();
      const identities = byCanonicalTarget.get(key) ?? [];
      identities.push(candidate.identity);
      byCanonicalTarget.set(key, identities);
    }
    for (const identities of byCanonicalTarget.values()) {
      if (identities.length < 2) continue;
      for (const identity of identities) collisions.add(identity);
      uncertainties.push(
        `Skill provenance entries ${identities.join(", ")} collide on one canonical target`
      );
    }

    return {
      directories: new Map(
        candidates
          .filter((candidate) => !collisions.has(candidate.identity))
          .map((candidate) => [candidate.identity, candidate.directory])
      ),
      uncertainties
    };
  } catch {
    return {
      directories: new Map(),
      uncertainties: ["Skill provenance lock is not valid JSON"]
    };
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
    for (const uncertainty of lock.uncertainties) {
      uncertainties.push({
        source: artifact.path,
        detail: `${uncertainty}; the affected local skill remains project-authored`
      });
    }
    for (const [identity, directory] of lock.directories) {
      if (artifacts.some((candidate) => skillDirectory(candidate.path) === directory)) {
        thirdPartyDirectories.add(directory);
      } else {
        uncertainties.push({
          source: artifact.path,
          detail: `Locked skill ${identity} does not map to one local skill directory: ${directory}; the affected local skill remains project-authored`
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
