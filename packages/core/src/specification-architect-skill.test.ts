import { readFile, readdir } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { SPEC_STATUSES } from "./model.js";
import { parseSafeYaml } from "./safe-yaml.js";

const repositoryRoot = new URL("../../../", import.meta.url);
const skillDirectory = new URL(".agents/skills/specification-architect/", repositoryRoot);
const skillPath = new URL("SKILL.md", skillDirectory);
const activeSpecificationPath = new URL(
  "specs/active/SPEC-0001C-specification-architect.md",
  repositoryRoot
);

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

  it("contains the required create, refine, and review workflow decisions", async () => {
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

  it("enforces authority, supersession, implementation, and completion gates", async () => {
    const skill = await readSkill();
    expect(skill).toContain("Keep one authoritative file per ID.");
    expect(skill).toContain("`supersedes` or `superseded_by`");
    expect(skill).toContain("blocks readiness");
    expect(skill).toContain("Only explicit human approval permits `draft -> ready`");
    expect(skill).toContain("prevent non-trivial implementation");
    expect(skill).toContain("missing, conflicted, or still `draft`");
    expect(skill).toContain("Implementation begins with `ready -> active`");
    expect(skill).toContain("Recommend `active -> done` only when");
    expect(skill).toContain("reviewed-but-unchanged document with a concise reason");
    expect(skill).toContain("Cancellation requires a reason.");
  });

  it("uses only repository statuses and agrees with the active specification", async () => {
    const skill = await readSkill();
    const lifecycle = skill.match(/```text\n([\s\S]*?)\n```/)?.[1] ?? "";
    for (const status of SPEC_STATUSES) expect(lifecycle).toContain(status);
    expect(lifecycle).not.toMatch(/blocked|approved|in_progress/);

    const specification = await readFile(activeSpecificationPath, "utf8");
    expect(specification).toMatch(/\| Status \| active \|/);
    expect(specification).toContain("$specification-architect create");
    expect(specification).toContain("$specification-architect refine <spec-id>");
    expect(specification).toContain("$specification-architect review <spec-id>");
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
