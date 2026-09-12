export interface ReleaseFixture {
  name: string;
  condition: string;
  files: Readonly<Record<string, string>>;
  expectedFindingCodes?: readonly string[];
}

const duplicateInstructions =
  "# Shared workflow\nAlways run the repository verification command before completion.\n";

export const releaseFixtures: readonly ReleaseFixture[] = [
  {
    name: "lightly-initialized",
    condition: "empty or lightly initialized project",
    files: { ".gitignore": "dist/\n" }
  },
  {
    name: "well-configured",
    condition: "existing well-configured project",
    files: {
      "README.md": "# Service\n\nA maintained TypeScript service. Run `pnpm test`.\n",
      "AGENTS.md": "# Repository instructions\n\nPreserve existing behavior and run `pnpm test`.\n",
      "package.json": JSON.stringify({ scripts: { test: "vitest run" } }),
      "src/index.ts": "export const ready = true;\n"
    }
  },
  {
    name: "duplicated-instructions",
    condition: "conflicting or duplicated instructions",
    files: { "AGENTS.md": duplicateInstructions, "prompts/copied.md": duplicateInstructions },
    expectedFindingCodes: ["DUPLICATE_AI_MATERIAL"]
  },
  {
    name: "broken-references",
    condition: "broken references and renamed commands",
    files: {
      "README.md": "See [missing](docs/missing.md) and run `pnpm verify`.\n",
      "package.json": JSON.stringify({ scripts: { test: "vitest run" } })
    },
    expectedFindingCodes: ["BROKEN_REFERENCE", "DOCUMENTED_COMMAND_MISSING"]
  },
  {
    name: "nested-instructions",
    condition: "nested AGENTS.md files",
    files: {
      "AGENTS.md": "# Root\n\nUse the repository verification workflow.\n",
      "packages/app/AGENTS.md": "# App\n\nRun the app-specific test suite.\n",
      "packages/app/src/index.ts": "export const app = true;\n"
    }
  },
  {
    name: "skill-provenance",
    condition: "project-authored and third-party skills with provenance",
    files: {
      ".agents/skills/local/SKILL.md":
        "---\nname: local\ndescription: Local procedure\n---\n# Local\n",
      ".agents/skills/vendor/SKILL.md":
        "---\nname: vendor\ndescription: Vendor procedure\n---\n# Vendor\n",
      ".agents/skills-lock.json": JSON.stringify({
        version: 1,
        skills: {
          vendor: { path: ".agents/skills/vendor", source: "github:example/vendor" }
        }
      })
    }
  },
  {
    name: "ai-heavy-overlap",
    condition: "AI-heavy repository with overlapping prompts, agents, and skills",
    files: {
      "AGENTS.md": duplicateInstructions,
      "prompts/review.md": duplicateInstructions,
      "agents/reviewer.md": "# Reviewer\nReview all changes.\n",
      "hooks/verify.md": "# Hook\nRun verification.\n",
      "mcp/README.md": "# MCP\nLocal configuration notes.\n"
    },
    expectedFindingCodes: ["DUPLICATE_AI_MATERIAL"]
  },
  {
    name: "unclear-spec-authority",
    condition: "superseded specifications with unclear authority",
    files: {
      "specs/active/SPEC-X.md": "| ID | SPEC-X |\n| Status | active |\n",
      "specs/ready/SPEC-X-copy.md":
        "| ID | SPEC-X |\n| Status | ready |\n| Supersedes | SPEC-MISSING |\n"
    },
    expectedFindingCodes: [
      "DUPLICATE_SPEC_ID",
      "SPEC_PRECEDENCE_CONFLICT",
      "BROKEN_SPEC_RELATIONSHIP"
    ]
  },
  {
    name: "ci-local-mismatch",
    condition: "CI and local verification mismatch",
    files: {
      "package.json": JSON.stringify({ scripts: { test: "vitest run" } }),
      ".github/workflows/ci.yml": "steps:\n  - run: pnpm ci:missing\n"
    },
    expectedFindingCodes: ["CI_COMMAND_MISSING"]
  },
  {
    name: "developer-and-runtime-ai",
    condition: "developer-AI configuration alongside deferred runtime/product AI",
    files: {
      ".codex/config.toml": 'model = "gpt-5"\n',
      "package.json": JSON.stringify({ dependencies: { openai: "1.0.0" } }),
      "src/index.ts": "export const runtimeAiDeferred = true;\n"
    }
  },
  {
    name: "ownership-and-drift",
    condition: "existing user-owned files and manually changed managed files",
    files: {
      "AGENTS.md": "# User instructions\n\nPreserve this project-owned content.\n",
      ".devcharter/managed-files.json": JSON.stringify({
        version: 1,
        files: [
          {
            path: "docs/managed.md",
            adapter: "codex",
            baselineHash: "0".repeat(64),
            managed: true
          }
        ]
      }),
      "docs/managed.md": "manually changed\n"
    }
  },
  {
    name: "small-monorepo",
    condition: "small monorepo",
    files: {
      "package.json": JSON.stringify({
        private: true,
        workspaces: ["packages/*"],
        scripts: { test: "pnpm -r test" }
      }),
      "pnpm-workspace.yaml": "packages:\n  - packages/*\n",
      "packages/a/package.json": JSON.stringify({ name: "a", scripts: { test: "vitest run" } }),
      "packages/b/package.json": JSON.stringify({ name: "b", scripts: { test: "vitest run" } })
    }
  }
];
