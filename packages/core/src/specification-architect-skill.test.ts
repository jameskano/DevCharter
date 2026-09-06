import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { SPEC_STATUSES } from "./model.js";
import { parseSafeYaml } from "./safe-yaml.js";

const repositoryRoot = new URL("../../../", import.meta.url);
const skillDirectory = new URL(".agents/skills/specification-architect/", repositoryRoot);
const skillPath = new URL("SKILL.md", skillDirectory);
const specificationsDirectory = fileURLToPath(new URL("specs/", repositoryRoot));

async function readSkill(): Promise<string> {
  return (await readFile(skillPath, "utf8")).replace(/\r\n?/g, "\n");
}

function frontmatter(source: string): Record<string, unknown> {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  expect(match).not.toBeNull();
  const parsed = parseSafeYaml(match?.[1] ?? "", "SKILL.md frontmatter");
  expect(parsed.ok).toBe(true);
  if (!parsed.ok || parsed.value === null || typeof parsed.value !== "object") return {};
  return parsed.value as Record<string, unknown>;
}

async function findMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(
    entries
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return findMarkdownFiles(path);
        return entry.isFile() && entry.name.endsWith(".md") ? [path] : [];
      })
  );
  return paths.flat();
}

function metadataValue(source: string, field: string): string | undefined {
  return source.match(new RegExp(`^\\| ${field} \\| ([^|]+) \\|$`, "m"))?.[1]?.trim();
}

async function authoritativeSpecification() {
  const candidates = await Promise.all(
    (await findMarkdownFiles(specificationsDirectory)).map(async (path) => ({
      path,
      source: (await readFile(path, "utf8")).replace(/\r\n?/g, "\n")
    }))
  );
  const matches = candidates.filter(({ source }) => metadataValue(source, "ID") === "SPEC-0001C");
  expect(matches).toHaveLength(1);
  return matches[0]!;
}

describe("Specification Architect skill", () => {
  it("uses the one requested instruction-only repository location", async () => {
    expect(await readdir(skillDirectory)).toEqual(["SKILL.md"]);
  });

  it("has valid, discriminating frontmatter and trigger boundaries", async () => {
    const metadata = frontmatter(await readSkill());
    expect(Object.keys(metadata).sort()).toEqual(["description", "name"]);
    expect(metadata.name).toBe("specification-architect");
    expect(metadata.description).toEqual(expect.any(String));
    const description = metadata.description as string;
    expect(description).toMatch(/Create, refine, or review an authoritative specification/);
    expect(description).toMatch(/non-trivial development/);
    expect(description).toMatch(/Do not use for small behavior-preserving maintenance/);
    expect(description).toMatch(/ready or active specification/);
  });

  it("contains the required create, refine, and review structure", async () => {
    const skill = await readSkill();
    for (const heading of [
      "## Inspect before deciding",
      "## Classify whether a specification is required",
      "## Separate knowledge and decisions",
      "## Create",
      "## Refine",
      "## Review",
      "## Lifecycle and boundaries"
    ]) {
      expect(skill).toContain(heading);
    }
    expect(skill).toContain("Apply context precedence in this order:");
    expect(skill).toContain("Do not silently choose one.");
    expect(skill).toContain("one cohesive `draft` by default");
    expect(skill).toContain("Include only applicable sections");
    expect(skill).toContain("starting state, action, and result");
    expect(skill).toContain("Map each criterion");
    expect(skill).toContain("Require explicit confirmation for security, privacy, identity");
    expect(skill).toContain(
      "An informal approved deviation cannot bypass completion requirements."
    );
  });

  it("classifies specification work without creating placeholder drafts", async () => {
    const skill = await readSkill();
    expect(skill).toContain("A new or updated specification is normally required");
    expect(skill).toContain("small behavior-preserving maintenance task");
    expect(skill).toContain("observable behavior and the existing contract remain unchanged");
    expect(skill).toContain("Do not create a placeholder draft.");
  });

  it("discovers authority, applies precedence, and requires explicit supersession", async () => {
    const skill = await readSkill();
    expect(skill).toContain("specification index and every specification location");
    expect(skill).toContain("declared ID, status, parent");
    expect(skill).toContain("Apply context precedence in this order:");
    expect(skill).toContain("Do not silently choose one.");
    expect(skill).toContain("Keep one authoritative file per ID.");
    expect(skill).toContain("`supersedes` or `superseded_by`");
    expect(skill).toContain("blocks readiness");
  });

  it("separates evidence, assumptions, decisions, and sensitive approvals", async () => {
    const skill = await readSkill();
    expect(skill).toContain("confirmed facts, each with its repository or user source");
    expect(skill).toContain("inferences, each with evidence and confidence");
    expect(skill).toContain("low-risk reversible details");
    expect(skill).toContain("evidence, impact if wrong, and reversibility");
    expect(skill).toContain("Require explicit confirmation for security, privacy, identity");
    expect(skill).toContain("Do not convert a sensitive unresolved decision into an assumption");
  });

  it("preserves lifecycle state during refine and renews material approval", async () => {
    const skill = await readSkill();
    expect(skill).toContain("Refining a `draft` keeps it `draft`.");
    expect(skill).toContain(
      "Refining a `ready` or `active` specification preserves its current status"
    );
    expect(skill).toContain("do not move it backward to represent renewed review");
    expect(skill).toContain("materially changes approved behavior");
    expect(skill).toContain("do not begin or continue the affected implementation");
    expect(skill).toContain("human explicitly approves the revised behavior");
    expect(skill).toContain("Approval state is review metadata, not another lifecycle status.");
  });

  it("enforces readiness, implementation, evidence-mapping, and completion gates", async () => {
    const skill = await readSkill();
    expect(skill).toContain("starting state, action, and result");
    expect(skill).toContain("Map each criterion");
    expect(skill).toContain("Only explicit human approval permits `draft -> ready`");
    expect(skill).toContain("prevent non-trivial implementation");
    expect(skill).toContain("missing, conflicted, or still `draft`");
    expect(skill).toContain("Implementation begins with `ready -> active`");
    expect(skill).toContain("Recommend `active -> done` only when");
    expect(skill).toContain("reviewed-but-unchanged document with a concise reason");
    expect(skill).toContain("does not treat author verification as independent evidence");
    expect(skill).toContain("Cancellation requires a reason.");
  });

  it("discovers exactly one authoritative specification whose directory matches its status", async () => {
    const skill = await readSkill();
    const lifecycle = skill.match(/```text\n([\s\S]*?)\n```/)?.[1] ?? "";
    for (const status of SPEC_STATUSES) expect(lifecycle).toContain(status);
    expect(lifecycle).not.toMatch(/blocked|approved|in_progress/);

    const specification = await authoritativeSpecification();
    const status = metadataValue(specification.source, "Status");
    expect(SPEC_STATUSES).toContain(status);
    expect(basename(dirname(specification.path))).toBe(status);
    expect(relative(specificationsDirectory, specification.path)).toBe(
      join(status!, "SPEC-0001C-specification-architect.md")
    );
    expect(specification.source).toContain("$specification-architect create");
    expect(specification.source).toContain("$specification-architect refine <spec-id>");
    expect(specification.source).toContain("$specification-architect review <spec-id>");
    expect(specification.source).toContain("Refining a `draft` keeps it `draft`.");
    expect(specification.source).toContain(
      "Refining a `ready` or `active` specification preserves its status"
    );
  });

  it("does not add a runtime API, CLI command, or prohibited supporting behavior", async () => {
    const [corePackage, coreIndex, cli] = await Promise.all([
      readFile(new URL("packages/core/package.json", repositoryRoot), "utf8"),
      readFile(new URL("packages/core/src/index.ts", repositoryRoot), "utf8"),
      readFile(new URL("packages/cli/src/index.ts", repositoryRoot), "utf8")
    ]);
    expect(corePackage).not.toContain("specification-architect");
    expect(coreIndex).not.toContain("specification-architect");
    expect(cli).not.toContain("specification-architect");

    const skill = await readSkill();
    expect(skill).toContain("Do not create sessions");
    expect(skill).toContain("role agents");
    expect(skill).toContain("automatic approval");
    expect(skill).toContain("adapters, connectors, networking, persistence");
    expect(skill).toContain("extra public commands");
  });
});
