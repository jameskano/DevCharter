import { execFile } from "node:child_process";
import { readFile, symlink } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import {
  plannedFileChangeSchema,
  type AcceptedDecision,
  type EcosystemProposal,
  type RepositoryFingerprintInputs
} from "./model.js";
import {
  approveProposal,
  computeProposalFingerprint,
  computeRepositoryFingerprint,
  runProjectArchitect,
  type GitRunner
} from "./project-architect.js";
import { createTemporaryRepository, type TemporaryRepository } from "./testing.js";

const execFileAsync = promisify(execFile);
const repositories: TemporaryRepository[] = [];

afterEach(async () => {
  await Promise.all(repositories.splice(0).map((repository) => repository.cleanup()));
});

async function temporaryRepository(
  files: Readonly<Record<string, string>> = {}
): Promise<TemporaryRepository> {
  const repository = await createTemporaryRepository(files);
  repositories.push(repository);
  return repository;
}

const establishedSource = `
export interface Account { id: string; active: boolean }
export function activate(account: Account): Account {
  if (account.active) return account;
  return { ...account, active: true };
}
`;

function outcome(value = "Ship a dependable application"): AcceptedDecision {
  return { id: "project.outcome", value };
}

function resolvedNewDecisions(outcomeValue = "Ship a dependable application"): AcceptedDecision[] {
  return [
    outcome(outcomeValue),
    { id: "project.aiTools", value: ["Codex"] },
    { id: "project.packageScripts", value: { test: "vitest run" } },
    { id: "project.constraints", value: [] },
    { id: "project.risks", value: [] }
  ];
}

function decisionsForScope(
  scope: "full" | "governance" | "engineering" | "ai"
): AcceptedDecision[] {
  return [
    outcome(),
    { id: "project.constraints", value: [] },
    { id: "project.risks", value: [] },
    ...(scope === "full" || scope === "engineering"
      ? [
          { id: "project.technologies", value: ["TypeScript", "Node.js"] },
          { id: "project.packageScripts", value: { test: "vitest run" } }
        ]
      : []),
    ...(scope === "full" || scope === "ai" ? [{ id: "project.aiTools", value: ["Codex"] }] : [])
  ];
}

async function proposalFor(
  repository: TemporaryRepository,
  acceptedDecisions: AcceptedDecision[] = resolvedNewDecisions()
): Promise<EcosystemProposal> {
  const result = await runProjectArchitect(repository.root, {
    mode: "new",
    scope: "full",
    acceptedDecisions
  });
  expect(result.ok).toBe(true);
  if (!result.ok || result.value.proposal === undefined) throw new Error("Expected proposal");
  return result.value.proposal;
}

describe("staged proposal contracts", () => {
  it("uses PlannedFileChange as the abstract change without rendering fields", () => {
    const parsed = plannedFileChangeSchema.safeParse({
      path: "AGENTS.md",
      action: "create",
      purpose: "Provide project instructions",
      reason: "The selected AI scope has no root instructions",
      origin: "devcharter",
      ownership: "project",
      dependencies: ["project outcome"],
      maintenanceImplication: "Keep instructions current",
      validationExpectations: ["References resolve"]
    });
    expect(parsed.success).toBe(true);
  });

  it("produces actual abstract changes and never renders or applies them", async () => {
    const repository = await temporaryRepository({ "src/index.ts": establishedSource });
    const before = await repository.snapshot();
    const result = await runProjectArchitect(repository.root, {
      mode: "new",
      acceptedDecisions: [outcome()]
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.proposal === undefined) return;
    expect(result.value.proposal.plannedChanges).toContainEqual(
      expect.objectContaining({ path: "AGENTS.md", action: "create" })
    );
    expect(
      result.value.proposal.plannedChanges.every(
        (change) =>
          change.content === undefined && change.diff === undefined && change.adapter === undefined
      )
    ).toBe(true);
    expect(result.value.proposal.approved).toBe(false);
    expect(result.value.appliedChanges).toEqual([]);
    expect(await repository.snapshot()).toEqual(before);
  });

  it("uses the one staged model for create, update, skip, and conflict decisions", async () => {
    const createRepository = await temporaryRepository();
    const createResult = await runProjectArchitect(createRepository.root, {
      mode: "new",
      scope: "ai",
      acceptedDecisions: [outcome()]
    });
    expect(createResult.ok && createResult.value.proposal?.plannedChanges).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "create" })])
    );

    const updateRepository = await temporaryRepository({
      "README.md": "See [missing](docs/missing.md)."
    });
    const updateResult = await runProjectArchitect(updateRepository.root, {
      mode: "retrofit",
      scope: "governance"
    });
    expect(updateResult.ok && updateResult.value.proposal?.plannedChanges).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "update", path: "README.md" })])
    );

    const skipRepository = await temporaryRepository({
      "package.json": '{"scripts":{"test":"vitest"}}'
    });
    const skipResult = await runProjectArchitect(skipRepository.root, {
      mode: "retrofit",
      scope: "engineering"
    });
    expect(skipResult.ok && skipResult.value.proposal?.plannedChanges).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "skip" })])
    );
    if (skipResult.ok) {
      const existingPaths = new Set(skipResult.value.artifacts.map((artifact) => artifact.path));
      expect(
        skipResult.value.plannedChanges
          .filter((change) => change.action === "skip")
          .every((change) => existingPaths.has(change.path))
      ).toBe(true);
    }

    const conflictRepository = await temporaryRepository({
      "specs/active/SPEC-X.md": "| ID | SPEC-X |\n| Status | ready |"
    });
    const conflictResult = await runProjectArchitect(conflictRepository.root, {
      mode: "retrofit",
      scope: "governance"
    });
    expect(conflictResult.ok && conflictResult.value.proposal?.plannedChanges).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "conflict" })])
    );
  });
});

describe("proposal identity and approval", () => {
  it("validates public library requests and approval records at runtime", async () => {
    const repository = await temporaryRepository({ "src/index.ts": establishedSource });
    await expect(
      runProjectArchitect(repository.root, { mode: "invalid" as never, scope: "full" })
    ).resolves.toMatchObject({ ok: false, error: { code: "INVALID_ARGUMENT" } });
    await expect(
      runProjectArchitect(repository.root, { mode: "audit", scope: "invalid" as never })
    ).resolves.toMatchObject({ ok: false, error: { code: "INVALID_ARGUMENT" } });

    const proposal = await proposalFor(repository);
    await expect(
      approveProposal(repository.root, proposal, {
        confirmed: false,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      } as never)
    ).resolves.toMatchObject({ ok: false, error: { code: "APPROVAL_REQUIRED" } });
  });

  it("binds confirmation to proposal, revision, and repository fingerprints", async () => {
    const repository = await temporaryRepository({ "src/index.ts": establishedSource });
    const proposal = await proposalFor(repository);
    const approval = {
      confirmed: true as const,
      proposalRevision: proposal.revision,
      proposalFingerprint: proposal.proposalFingerprint,
      repositoryFingerprint: proposal.repositoryFingerprint
    };
    const approved = await approveProposal(repository.root, proposal, approval);
    expect(approved).toEqual({ ok: true, value: { ...proposal, approved: true } });
    await expect(approveProposal(repository.root, proposal, approval)).resolves.toEqual(approved);
  });

  it("rejects cross-proposal replay when repository state and revision match", async () => {
    const repository = await temporaryRepository({ "src/index.ts": establishedSource });
    const first = await proposalFor(repository, resolvedNewDecisions("First outcome"));
    const second = await proposalFor(repository, resolvedNewDecisions("Second outcome"));
    expect(first.repositoryFingerprint).toBe(second.repositoryFingerprint);
    expect(first.revision).toBe(second.revision);
    expect(first.proposalFingerprint).not.toBe(second.proposalFingerprint);
    const replay = await approveProposal(repository.root, second, {
      confirmed: true,
      proposalRevision: first.revision,
      proposalFingerprint: first.proposalFingerprint,
      repositoryFingerprint: first.repositoryFingerprint
    });
    expect(replay).toMatchObject({ ok: false, error: { code: "STALE_PROPOSAL" } });
  });

  it("invalidates approval for every material proposal-content family", async () => {
    const repository = await temporaryRepository({ "src/index.ts": establishedSource });
    const proposal = await proposalFor(repository);
    const approval = {
      confirmed: true as const,
      proposalRevision: proposal.revision,
      proposalFingerprint: proposal.proposalFingerprint,
      repositoryFingerprint: proposal.repositoryFingerprint
    };
    const additionalFinding = {
      code: "ADDED_CONFLICT",
      summary: "An additional conflict was discovered",
      evidence: [{ source: "src/index.ts" }],
      scope: "engineering" as const,
      impact: "medium" as const,
      confidence: "high" as const,
      recommendedAction: "Review the additional conflict"
    };
    const variants: EcosystemProposal[] = [
      { ...proposal, mode: "retrofit" },
      { ...proposal, scope: "engineering" },
      { ...proposal, desiredOutcome: "A changed desired outcome" },
      {
        ...proposal,
        facts: [
          ...proposal.facts,
          {
            key: "engineering.changedFact",
            value: true,
            state: "confirmed",
            evidence: [{ source: "src/index.ts" }]
          }
        ]
      },
      { ...proposal, findings: [...proposal.findings, additionalFinding] },
      {
        ...proposal,
        findings: [...proposal.findings, additionalFinding],
        conflicts: [...proposal.conflicts, additionalFinding]
      },
      { ...proposal, assumptions: [{ summary: "A changed assumption" }] },
      { ...proposal, acceptedDecisions: [outcome("Changed decision")] },
      {
        ...proposal,
        questions: [
          ...proposal.questions,
          {
            id: "optional.note",
            question: "Record an optional note?",
            context: "Optional context",
            reason: "Optional information can refine the proposal",
            evidence: [{ source: "repository analysis" }],
            requiredForApproval: false
          }
        ]
      },
      {
        ...proposal,
        criticalJourneys: [
          ...proposal.criticalJourneys,
          {
            id: "changed-journey",
            summary: "A changed critical journey",
            evidence: [{ source: "src/index.ts" }],
            verification: "Run the changed journey"
          }
        ]
      },
      {
        ...proposal,
        consideredComponents: [
          ...proposal.consideredComponents,
          {
            component: "Hooks",
            decision: "reject",
            reason: "Hooks are not justified by repository evidence"
          }
        ]
      },
      {
        ...proposal,
        plannedChanges: proposal.plannedChanges.map((change, index) =>
          index === 0 ? { ...change, path: "CHANGED.md" } : change
        )
      },
      { ...proposal, preservedPaths: [...proposal.preservedPaths, "extra.txt"] },
      { ...proposal, risks: [...proposal.risks, "Changed risk"] },
      { ...proposal, validation: [...proposal.validation, "Changed validation"] },
      { ...proposal, deferredWork: [...proposal.deferredWork, "Changed deferral"] }
    ];
    for (const variant of variants) {
      await expect(approveProposal(repository.root, variant, approval)).resolves.toMatchObject({
        ok: false,
        error: { code: "STALE_PROPOSAL" }
      });
    }
  });

  it("rejects unresolved questions and stale repository state", async () => {
    const repository = await temporaryRepository();
    const proposal = await proposalFor(repository, []);
    const approval = {
      confirmed: true as const,
      proposalRevision: proposal.revision,
      proposalFingerprint: proposal.proposalFingerprint,
      repositoryFingerprint: proposal.repositoryFingerprint
    };
    await expect(approveProposal(repository.root, proposal, approval)).resolves.toMatchObject({
      ok: false,
      error: { code: "APPROVAL_REQUIRED" }
    });

    const resolved = await proposalFor(repository, [
      ...resolvedNewDecisions(),
      { id: "project.technologies", value: ["TypeScript", "Node.js"] }
    ]);
    await repository.write("package.json", '{"name":"changed"}');
    await expect(
      approveProposal(repository.root, resolved, {
        confirmed: true,
        proposalRevision: resolved.revision,
        proposalFingerprint: resolved.proposalFingerprint,
        repositoryFingerprint: resolved.repositoryFingerprint
      })
    ).resolves.toMatchObject({ ok: false, error: { code: "STALE_PROPOSAL" } });
  });

  it("increments proposal revision when accepted decisions change", async () => {
    const repository = await temporaryRepository({ "src/index.ts": establishedSource });
    const first = await proposalFor(repository, [outcome("First")]);
    const refreshed = await runProjectArchitect(repository.root, {
      mode: "new",
      acceptedDecisions: [outcome("Second")],
      previousProposal: first
    });
    expect(refreshed.ok).toBe(true);
    if (refreshed.ok) expect(refreshed.value.proposal?.revision).toBe(first.revision + 1);
  });

  it("computes proposal fingerprints deterministically", async () => {
    const repository = await temporaryRepository({ "src/index.ts": establishedSource });
    const proposal = await proposalFor(repository);
    expect(computeProposalFingerprint(proposal)).toBe(proposal.proposalFingerprint);
    expect(computeProposalFingerprint({ ...proposal, approved: true })).toBe(
      proposal.proposalFingerprint
    );
  });
});

describe("evidence-weighted establishment", () => {
  it.each([
    ["established source without tests", { "src/domain.ts": establishedSource }],
    ["established without governance", { "src/main.ts": establishedSource, "package.json": "{}" }],
    [
      "small single-package application",
      { "index.ts": establishedSource, "package.json": '{"scripts":{"start":"node index.js"}}' }
    ]
  ])("recommends retrofit for %s", async (_name, files) => {
    const repository = await temporaryRepository(files);
    const result = await runProjectArchitect(repository.root, { mode: "audit" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.recommendation.recommendedMode).toBe("retrofit");
      expect(
        result.value.recommendation.signals.some((signal) => signal.strength === "strong")
      ).toBe(true);
    }
  });

  it.each([
    ["empty scaffold", { "src/main.ts": "export {};", "package.json": "{}" }],
    [
      "README plus minimal manifest",
      { "README.md": "# Starter", "package.json": '{"name":"starter"}' }
    ]
  ])("keeps %s eligible for new", async (_name, files) => {
    const repository = await temporaryRepository(files);
    const result = await runProjectArchitect(repository.root, { mode: "audit" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.recommendation.recommendedMode).toBe("new");
  });

  it.each([
    ["deployment configuration", { Dockerfile: "FROM node:20" }],
    [
      "substantive current documentation",
      { "docs/product/current.md": "Current supported product behavior. ".repeat(100) }
    ],
    [
      "application structure with operational support",
      { "src/main.ts": "export {};", "tests/main.test.ts": "test('main', () => {});" }
    ]
  ])("uses explicit establishment rules for %s", async (_name, files) => {
    const repository = await temporaryRepository(files);
    const result = await runProjectArchitect(repository.root, { mode: "audit" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.recommendation.recommendedMode).toBe("retrofit");
  });

  it.each([
    ["full", ["project.aiTools", "project.outcome", "project.technologies"]],
    ["governance", ["project.outcome"]],
    ["engineering", ["project.outcome", "project.technologies"]],
    ["ai", ["project.aiTools", "project.outcome"]]
  ] as const)("asks only contextual unresolved questions for %s", async (scope, expectedIds) => {
    const repository = await temporaryRepository({ "README.md": "# Starter" });
    const unresolved = await runProjectArchitect(repository.root, { mode: "new", scope });
    expect(unresolved.ok).toBe(true);
    if (!unresolved.ok) return;
    expect(unresolved.value.questions.map((question) => question.id)).toEqual(expectedIds);
    expect(
      unresolved.value.questions.find((question) => question.id === "project.outcome")
    ).toMatchObject({
      requiredForApproval: true,
      context: expect.any(String),
      reason: expect.any(String)
    });

    const resolved = await runProjectArchitect(repository.root, {
      mode: "new",
      scope,
      acceptedDecisions: decisionsForScope(scope)
    });
    expect(resolved.ok).toBe(true);
    if (resolved.ok) expect(resolved.value.questions).toEqual([]);
  });
});

describe("scoped fingerprint boundaries and classification", () => {
  it("exposes every fingerprint input and safe exclusion", async () => {
    const repository = await temporaryRepository({
      "src/index.ts": establishedSource,
      "README.md": "# Project",
      ".env": "TOKEN=secret",
      "asset.bin": "\0binary",
      "dist/output.js": "generated",
      "node_modules/vendor/index.js": "third party",
      "src/large.ts": "x".repeat(4 * 1024 * 1024 + 1)
    });
    const result = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "engineering"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.fingerprintInputs.includedPaths).toContainEqual(
      expect.objectContaining({
        path: "src/index.ts",
        digest: expect.stringMatching(/^[a-f0-9]{64}$/)
      })
    );
    expect(result.value.fingerprintInputs.excludedPaths).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ".env", reason: "likely-secret" }),
        expect.objectContaining({ path: "asset.bin", reason: "binary" }),
        expect.objectContaining({ path: "dist", reason: "generated-vendor" }),
        expect.objectContaining({ path: "node_modules", reason: "dependency" }),
        expect.objectContaining({ path: "src/large.ts", reason: "oversized" })
      ])
    );
    expect(result.value.repositoryFingerprint).toBe(
      computeRepositoryFingerprint(result.value.fingerprintInputs)
    );
    expect(result.value.semanticallyInspectedPaths).not.toContain(".env");
    expect(result.value.semanticallyInspectedPaths).not.toContain("asset.bin");
  });

  it("distinguishes project and explicitly third-party Codex skills", async () => {
    const repository = await temporaryRepository({
      ".agents/skills/project/SKILL.md": "# Project procedure",
      ".agents/skills/vendor/SKILL.md": "# Vendor procedure",
      ".agents/skills/vendor/package.json": '{"name":"vendor","devcharterOrigin":"third-party"}'
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.value.artifacts.find((item) => item.path.endsWith("project/SKILL.md"))
    ).toMatchObject({
      origin: "project",
      nativeTarget: "codex-skill"
    });
    expect(
      result.value.artifacts.find((item) => item.path.endsWith("vendor/SKILL.md"))
    ).toMatchObject({
      origin: "third-party",
      ownership: "third-party"
    });
  });

  it("distinguishes developer AI configuration, runtime AI, and unconfirmed AI dependencies", async () => {
    const runtime = await temporaryRepository({
      "AGENTS.md": "# Coding instructions",
      "package.json": '{"dependencies":{"openai":"1.0.0"}}',
      "src/ai.ts": "import OpenAI from 'openai'; export const client = new OpenAI();"
    });
    const runtimeResult = await runProjectArchitect(runtime.root, { mode: "audit", scope: "full" });
    expect(runtimeResult.ok).toBe(true);
    if (runtimeResult.ok) {
      expect(runtimeResult.value.facts.map((fact) => fact.key)).toEqual(
        expect.arrayContaining(["ai.developerConfiguration", "ai.runtimeImplementation"])
      );
    }

    const dependencyOnly = await temporaryRepository({
      "package.json": '{"dependencies":{"openai":"1.0.0"}}',
      "src/index.ts": establishedSource
    });
    const dependencyResult = await runProjectArchitect(dependencyOnly.root, {
      mode: "audit",
      scope: "full"
    });
    expect(dependencyResult.ok).toBe(true);
    if (dependencyResult.ok) {
      expect(dependencyResult.value.facts.map((fact) => fact.key)).toContain(
        "ai.unusedOrUnconfirmedDependencies"
      );
    }
  });

  it.each([
    {
      ecosystem: "npm",
      manifestPath: "apps/web/package.json",
      manifest: '{"dependencies":{"openai":"1.0.0"}}',
      sourcePath: "apps/web/src/ai.ts",
      source: "import OpenAI from 'openai'; export const client = new OpenAI();",
      dependency: "openai"
    },
    {
      ecosystem: "Python",
      manifestPath: "pyproject.toml",
      manifest: '[project]\ndependencies = ["openai>=1"]\n',
      sourcePath: "src/ai.py",
      source: "from openai import OpenAI\nclient = OpenAI()\n",
      dependency: "openai"
    },
    {
      ecosystem: "Cargo",
      manifestPath: "Cargo.toml",
      manifest:
        '[package]\nname = "demo"\nversion = "0.1.0"\n[dependencies]\nasync-openai = "0.27"\n',
      sourcePath: "src/lib.rs",
      source: "use async_openai::Client;\npub fn client() {}\n",
      dependency: "async-openai"
    },
    {
      ecosystem: "Go",
      manifestPath: "go.mod",
      manifest: "module example.test/demo\n\nrequire github.com/sashabaranov/go-openai v1.40.1\n",
      sourcePath: "src/main.go",
      source:
        'package main\nimport "github.com/sashabaranov/go-openai"\nfunc main() { _ = openai.Client{} }\n',
      dependency: "github.com/sashabaranov/go-openai"
    },
    {
      ecosystem: "Maven Java",
      manifestPath: "pom.xml",
      manifest:
        "<project><dependencies><dependency><groupId>com.openai</groupId><artifactId>openai-java</artifactId></dependency></dependencies></project>",
      sourcePath: "src/App.java",
      source: "import com.openai.client.OpenAIClient;\nclass App {}\n",
      dependency: "com.openai:openai-java"
    },
    {
      ecosystem: "Maven Kotlin",
      manifestPath: "services/assistant/pom.xml",
      manifest:
        "<project><dependencies><dependency><groupId>com.anthropic</groupId><artifactId>anthropic-java</artifactId></dependency></dependencies></project>",
      sourcePath: "services/assistant/src/App.kt",
      source: "import com.anthropic.client.AnthropicClient\nclass App\n",
      dependency: "com.anthropic:anthropic-java"
    }
  ])(
    "classifies declared and imported $ecosystem AI dependencies without guessing dependency-only use",
    async ({ manifestPath, manifest, sourcePath, source, dependency }) => {
      const runtimeRepository = await temporaryRepository({
        [manifestPath]: manifest,
        [sourcePath]: source
      });
      const runtime = await runProjectArchitect(runtimeRepository.root, {
        mode: "audit",
        scope: "ai"
      });
      expect(runtime.ok).toBe(true);
      if (!runtime.ok) return;
      expect(runtime.value.facts).toContainEqual(
        expect.objectContaining({
          key: "ai.runtimeImplementation",
          value: expect.arrayContaining([dependency]),
          evidence: expect.arrayContaining([
            expect.objectContaining({ source: manifestPath }),
            expect.objectContaining({ source: sourcePath })
          ])
        })
      );

      const dependencyOnlyRepository = await temporaryRepository({ [manifestPath]: manifest });
      const dependencyOnly = await runProjectArchitect(dependencyOnlyRepository.root, {
        mode: "audit",
        scope: "ai"
      });
      expect(dependencyOnly.ok).toBe(true);
      if (!dependencyOnly.ok) return;
      expect(dependencyOnly.value.facts).toContainEqual(
        expect.objectContaining({
          key: "ai.unusedOrUnconfirmedDependencies",
          value: expect.arrayContaining([dependency]),
          evidence: expect.arrayContaining([expect.objectContaining({ source: manifestPath })])
        })
      );
      expect(dependencyOnly.value.facts.map((fact) => fact.key)).not.toContain(
        "ai.runtimeImplementation"
      );
    }
  );

  it("does not infer runtime AI from developer-AI configuration alone", async () => {
    const repository = await temporaryRepository({
      "AGENTS.md": "# Instructions\nUse repository evidence and run verification before completion."
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.facts.map((fact) => fact.key)).toContain("ai.developerConfiguration");
      expect(result.value.facts.map((fact) => fact.key)).not.toContain("ai.runtimeImplementation");
    }
  });

  it("adds safe referenced paths explicitly and excludes secret changes from identity", async () => {
    const repository = await temporaryRepository({
      "AGENTS.md": "Read [project context](private/context.md).",
      "private/context.md": "# Context\nRepository-specific operating rules.",
      ".env": "TOKEN=first"
    });
    const first = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.fingerprintInputs.includedPaths).toContainEqual(
      expect.objectContaining({ path: "private/context.md", reason: "reference-dependency" })
    );
    await repository.write(".env", "TOKEN=second");
    const second = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(second.ok).toBe(true);
    if (second.ok)
      expect(second.value.repositoryFingerprint).toBe(first.value.repositoryFingerprint);
  });

  it("validates path-only Markdown code spans outside fenced examples", async () => {
    const repository = await temporaryRepository({
      "MANIFEST.md": [
        "Read `private/context.txt` and `docs/missing.md` before work.",
        "Ignore `pnpm test`, `https://example.test/docs`, and `{generated}/path.md`.",
        "Optional mechanisms include `AGENTS.override.md` and `pyproject.toml`.",
        "The independent review discusses `app/vendor` classification.",
        "```text",
        "docs/fenced-missing.md",
        "```"
      ].join("\n"),
      "private/context.txt": "Repository-specific context"
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "full" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.findings).toContainEqual(
      expect.objectContaining({
        code: "BROKEN_REFERENCE",
        summary: expect.stringContaining("docs/missing.md")
      })
    );
    expect(result.value.findings.some((item) => item.summary.includes("fenced-missing"))).toBe(
      false
    );
    expect(
      result.value.findings.some(
        (item) => item.summary.includes("AGENTS.override.md") || item.summary.includes("pyproject")
      )
    ).toBe(false);
    expect(result.value.findings.some((item) => item.summary.includes("app/vendor"))).toBe(false);
    expect(result.value.fingerprintInputs.includedPaths).toContainEqual(
      expect.objectContaining({
        path: "private/context.txt",
        reason: "reference-dependency"
      })
    );
  });

  it("invalidates approval when inline-referenced or ambiguous vendor project content changes", async () => {
    const repository = await temporaryRepository({
      "MANIFEST.md": "Read `private/context.txt` before work.",
      "private/context.txt": "First repository-specific context",
      "app/vendor/local.ts": "export const local = 'first';"
    });
    const proposal = await proposalFor(repository, [
      ...resolvedNewDecisions(),
      { id: "project.technologies", value: ["TypeScript", "Node.js"] },
      { id: "project.mode", value: "new" }
    ]);
    expect(proposal.preservedPaths).toEqual(
      expect.arrayContaining(["app/vendor/local.ts", "private/context.txt"])
    );

    const approval = {
      confirmed: true as const,
      proposalRevision: proposal.revision,
      proposalFingerprint: proposal.proposalFingerprint,
      repositoryFingerprint: proposal.repositoryFingerprint
    };
    await repository.write("private/context.txt", "Second repository-specific context");
    await expect(approveProposal(repository.root, proposal, approval)).resolves.toMatchObject({
      ok: false,
      error: { code: "STALE_PROPOSAL" }
    });

    const refreshed = await proposalFor(repository, [
      ...resolvedNewDecisions(),
      { id: "project.technologies", value: ["TypeScript", "Node.js"] },
      { id: "project.mode", value: "new" }
    ]);
    await repository.write("app/vendor/local.ts", "export const local = 'second';");
    await expect(
      approveProposal(repository.root, refreshed, {
        ...approval,
        proposalRevision: refreshed.revision,
        proposalFingerprint: refreshed.proposalFingerprint,
        repositoryFingerprint: refreshed.repositoryFingerprint
      })
    ).resolves.toMatchObject({ ok: false, error: { code: "STALE_PROPOSAL" } });
  });

  it("detects source-of-truth, status, reference, and command conflicts", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"scripts":{"test":"vitest"}}',
      "README.md": "Run `pnpm missing` and see [missing](docs/missing.md).",
      ".github/workflows/verify.yml": "steps:\n  - run: pnpm ci:missing",
      "specs/active/SPEC-X.md": "| ID | SPEC-X |\n| Status | ready |",
      "specs/ready/SPEC-X-copy.md":
        "| ID | SPEC-X |\n| Status | ready |\n| Supersedes | SPEC-MISSING |"
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "full" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.findings.map((item) => item.code)).toEqual(
        expect.arrayContaining([
          "SPEC_STATUS_PATH_CONFLICT",
          "DUPLICATE_SPEC_ID",
          "SPEC_PRECEDENCE_CONFLICT",
          "BROKEN_SPEC_RELATIONSHIP",
          "BROKEN_REFERENCE",
          "DOCUMENTED_COMMAND_MISSING",
          "CI_COMMAND_MISSING"
        ])
      );
    }
  });

  it("does not interpret source-code fixtures or ordinary prose as repository references", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"scripts":{"test":"vitest"}}',
      "README.md": "Use TypeScript and pnpm unless the active specification changes them.",
      "src/fixtures.ts":
        "export const fixture = '[missing](docs/missing.md) | ID | SPEC-X | | Supersedes | SPEC-MISSING |';"
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "full" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.findings).toEqual([]);
    }
  });

  it("does not treat package-manager built-ins as repository scripts", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"scripts":{"test":"vitest"}}',
      "README.md":
        "Run `pnpm install`, `pnpm audit`, `pnpm exec eslint .`, and `pnpm why zod` when needed."
    });
    const result = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "engineering"
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.findings).toEqual([]);
  });

  it("returns stable results for unchanged repository state", async () => {
    const repository = await temporaryRepository({ "src/index.ts": establishedSource });
    const first = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      acceptedDecisions: [outcome()]
    });
    const second = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      acceptedDecisions: [outcome()]
    });
    expect(second).toEqual(first);
  });
});

describe("completion-review classification and analysis", () => {
  it.each(["vendor", "bower_components", "Pods", ".venv", "venv"])(
    "classifies the conventional %s directory as third-party without inspecting its contents",
    async (directory) => {
      const repository = await temporaryRepository({
        [`${directory}/lib/index.ts`]: establishedSource
      });
      const result = await runProjectArchitect(repository.root, {
        mode: "audit",
        scope: "engineering"
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.artifacts).toContainEqual({
        path: directory,
        kind: "dependency-directory",
        origin: "third-party"
      });
      expect(result.value.fingerprintInputs.excludedPaths).toContainEqual(
        expect.objectContaining({ path: directory, reason: "dependency" })
      );
      expect(result.value.semanticallyInspectedPaths).not.toContain(`${directory}/lib/index.ts`);
      expect(result.value.recommendation.recommendedMode).toBe("new");
    }
  );

  it.each(["services/api/node_modules", "services/api/.venv", "ios/Pods"])(
    "classifies the nested %s dependency boundary before recursion",
    async (directory) => {
      const repository = await temporaryRepository({
        [`${directory}/lib/index.ts`]: establishedSource
      });
      const result = await runProjectArchitect(repository.root, {
        mode: "audit",
        scope: "engineering"
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.artifacts).toContainEqual({
        path: directory,
        kind: "dependency-directory",
        origin: "third-party"
      });
      expect(result.value.semanticallyInspectedPaths).not.toContain(`${directory}/lib/index.ts`);
      expect(result.value.recommendation.recommendedMode).toBe("new");
    }
  );

  it.each([
    ".cache",
    ".gradle",
    ".mypy_cache",
    ".nox",
    ".pytest_cache",
    ".ruff_cache",
    ".tox",
    ".turbo"
  ])("classifies the %s directory as a cache", async (directory) => {
    const repository = await temporaryRepository({ [`${directory}/state.ts`]: establishedSource });
    const result = await runProjectArchitect(repository.root, { mode: "audit" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fingerprintInputs.excludedPaths).toContainEqual(
        expect.objectContaining({ path: directory, reason: "cache" })
      );
      expect(result.value.semanticallyInspectedPaths).not.toContain(`${directory}/state.ts`);
      expect(result.value.recommendation.recommendedMode).toBe("new");
    }
  });

  it("detects explicit prose commands, reference definitions, and instruction paths", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"scripts":{"test":"vitest"}}',
      "README.md": "To verify, run pnpm missing before release.\n[guide]: docs/missing-guide.md\n",
      "AGENTS.md": "Read docs/missing-policy.md before making changes."
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "full" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.findings.map((item) => item.code)).toEqual(
      expect.arrayContaining(["DOCUMENTED_COMMAND_MISSING", "BROKEN_REFERENCE"])
    );
    expect(result.value.findings.filter((item) => item.code === "BROKEN_REFERENCE")).toHaveLength(
      2
    );
  });

  it("resolves filtered workspace commands against the selected package manifest", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"name":"root","scripts":{"test":"vitest"}}',
      "packages/app/package.json": '{"name":"@acme/app","scripts":{"test":"vitest --project app"}}',
      "README.md": "Run `pnpm --filter @acme/app test` for the application."
    });
    const result = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "engineering"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.findings.map((item) => item.code)).not.toContain(
        "DOCUMENTED_COMMAND_MISSING"
      );
      expect(result.value.facts).toContainEqual(
        expect.objectContaining({ key: "engineering.commandAuthorities" })
      );
    }
  });

  it("reports ambiguous filtered workspace command authority without selecting a manifest", async () => {
    const repository = await temporaryRepository({
      "packages/a/package.json": '{"name":"@acme/shared","scripts":{"test":"vitest"}}',
      "packages/b/package.json": '{"name":"@acme/shared","scripts":{"test":"vitest"}}',
      "README.md": "Run `pnpm --filter @acme/shared test` for the shared package."
    });
    const result = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      scope: "engineering"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.conflicts).toContainEqual(
      expect.objectContaining({ code: "COMMAND_AUTHORITY_AMBIGUOUS" })
    );
    expect(result.value.findings.map((item) => item.code)).not.toContain(
      "DOCUMENTED_COMMAND_MISSING"
    );
    expect(result.value.plannedChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "README.md", action: "conflict" }),
        expect.objectContaining({ path: "packages/a/package.json", action: "conflict" }),
        expect.objectContaining({ path: "packages/b/package.json", action: "conflict" })
      ])
    );
  });

  it("reports missing verification and plans the inferred manifest once", async () => {
    const repository = await temporaryRepository({ "src/index.ts": establishedSource });
    const result = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      scope: "engineering"
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.proposal === undefined) return;
    expect(result.value.findings.map((item) => item.code)).toContain("MISSING_VERIFICATION");
    expect(result.value.proposal.plannedChanges).toContainEqual(
      expect.objectContaining({ path: "package.json", action: "create" })
    );
    expect(new Set(result.value.proposal.plannedChanges.map((item) => item.path)).size).toBe(
      result.value.proposal.plannedChanges.length
    );
  });

  it("reports duplicate AI material and unknown generated ownership as conflicts", async () => {
    const duplicated = "# Reusable procedure\nAlways run the project verification command.";
    const repository = await temporaryRepository({
      "AGENTS.md": duplicated,
      "AGENTS.override.md": "# Temporary override\nUse a different verification route.",
      "prompts/copy.md": duplicated,
      "src/generated.ts": "// @generated\nexport const generated = true;"
    });
    const result = await runProjectArchitect(repository.root, { mode: "retrofit", scope: "full" });
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.proposal === undefined) return;
    expect(result.value.conflicts.map((item) => item.code)).toEqual(
      expect.arrayContaining(["DUPLICATE_AI_MATERIAL", "UNKNOWN_GENERATED_OWNERSHIP"])
    );
    expect(
      result.value.proposal.plannedChanges.filter((item) => item.action === "conflict")
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "AGENTS.md" }),
        expect.objectContaining({ path: "prompts/copy.md" }),
        expect.objectContaining({ path: "src/generated.ts" })
      ])
    );
  });

  it.each([
    ["governance", ["governance."], ["ai.", "engineering."]],
    ["engineering", ["engineering."], ["ai.", "governance."]],
    ["ai", ["ai."], ["engineering.", "governance."]]
  ] as const)("keeps %s facts within scope", async (scope, included, excluded) => {
    const repository = await temporaryRepository({
      "AGENTS.md": "# Project instructions",
      "package.json": '{"dependencies":{"openai":"1.0.0"},"scripts":{"test":"vitest"}}',
      "src/ai.ts": "import OpenAI from 'openai'; export const client = new OpenAI();",
      "specs/active/SPEC-X.md": "| ID | SPEC-X |\n| Status | active |"
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const keys = result.value.facts.map((fact) => fact.key);
    expect(keys.some((key) => included.some((prefix) => key.startsWith(prefix)))).toBe(true);
    expect(keys.some((key) => excluded.some((prefix) => key.startsWith(prefix)))).toBe(false);
  });

  it("maps applicable root, nested, and override instruction authorities", async () => {
    const repository = await temporaryRepository({
      "AGENTS.md": "# Root instructions",
      "AGENTS.override.md": "# Root override",
      "packages/app/AGENTS.md": "# Application instructions"
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.facts).toContainEqual(
      expect.objectContaining({
        key: "ai.instructionAuthorities",
        value: [
          { path: "AGENTS.md", appliesTo: "/", kind: "base", effective: false },
          { path: "AGENTS.override.md", appliesTo: "/", kind: "override", effective: true },
          {
            path: "packages/app/AGENTS.md",
            appliesTo: "packages/app",
            kind: "base",
            effective: true
          }
        ]
      })
    );
    expect(result.value.conflicts.map((item) => item.code)).not.toContain(
      "INSTRUCTION_ROUTING_CONFLICT"
    );
  });
});

describe("completion-review questions, proposals, and approval", () => {
  it("requires exact package scripts before approving a package.json repair", async () => {
    const repository = await temporaryRepository();
    const unresolved = await runProjectArchitect(repository.root, {
      mode: "new",
      scope: "engineering",
      acceptedDecisions: [
        outcome(),
        { id: "project.technologies", value: ["TypeScript", "Node.js"] }
      ]
    });
    expect(unresolved).toMatchObject({
      ok: true,
      value: {
        questions: [
          {
            id: "project.packageScripts",
            requiredForApproval: true
          }
        ]
      }
    });
    if (!unresolved.ok || unresolved.value.proposal === undefined)
      throw new Error("proposal failed");
    const proposal = unresolved.value.proposal;
    await expect(
      approveProposal(repository.root, proposal, {
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      })
    ).resolves.toMatchObject({ ok: false, error: { code: "APPROVAL_REQUIRED" } });

    const resolved = await runProjectArchitect(repository.root, {
      mode: "new",
      scope: "engineering",
      acceptedDecisions: [
        outcome(),
        { id: "project.technologies", value: ["TypeScript", "Node.js"] },
        { id: "project.packageScripts", value: { test: "vitest run" } }
      ]
    });
    expect(resolved).toMatchObject({ ok: true, value: { questions: [] } });
  });

  it.each(["full", "governance", "engineering", "ai"] as const)(
    "produces an actionable resolved new proposal for %s",
    async (scope) => {
      const repository = await temporaryRepository();
      const result = await runProjectArchitect(repository.root, {
        mode: "new",
        scope,
        acceptedDecisions: decisionsForScope(scope)
      });
      expect(result.ok).toBe(true);
      if (!result.ok || result.value.proposal === undefined) return;
      expect(result.value.questions).toEqual([]);
      expect(result.value.proposal.plannedChanges.length).toBeGreaterThan(0);
      expect(new Set(result.value.proposal.plannedChanges.map((item) => item.path)).size).toBe(
        result.value.proposal.plannedChanges.length
      );
    }
  );

  it("validates decision identifiers, shapes, uniqueness, and manifest paths", async () => {
    const repository = await temporaryRepository();
    const invalidSets: AcceptedDecision[][] = [
      [{ id: "project.unknown", value: true }],
      [outcome(), outcome("duplicate")],
      [{ id: "project.technologies", value: [] }],
      [{ id: "project.constraints", value: [""] }],
      [{ id: "project.mode", value: "audit" }],
      [{ id: "project.manifestPath", value: "../outside.json" }]
    ];
    for (const acceptedDecisions of invalidSets) {
      await expect(
        runProjectArchitect(repository.root, { mode: "new", acceptedDecisions })
      ).resolves.toMatchObject({ ok: false, error: { code: "INVALID_ARGUMENT" } });
    }
  });

  it("requires and validates an explicit mode decision when establishment is uncertain", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"scripts":{"build":"tsc","lint":"eslint .","test":"vitest"}}'
    });
    const decisions: AcceptedDecision[] = [
      outcome(),
      { id: "project.aiTools", value: ["Codex"] },
      { id: "project.constraints", value: [] },
      { id: "project.risks", value: [] }
    ];
    const unresolved = await runProjectArchitect(repository.root, {
      mode: "new",
      acceptedDecisions: decisions
    });
    expect(unresolved.ok).toBe(true);
    if (unresolved.ok) {
      expect(unresolved.value.questions.map((question) => question.id)).toEqual(["project.mode"]);
    }
    const resolved = await runProjectArchitect(repository.root, {
      mode: "new",
      acceptedDecisions: [...decisions, { id: "project.mode", value: "new" }]
    });
    expect(resolved.ok).toBe(true);
    if (resolved.ok) expect(resolved.value.questions).toEqual([]);
    await expect(
      runProjectArchitect(repository.root, {
        mode: "new",
        acceptedDecisions: [...decisions, { id: "project.mode", value: "retrofit" }]
      })
    ).resolves.toMatchObject({ ok: false, error: { code: "INVALID_ARGUMENT" } });
  });

  it("asks for an unknown technology manifest and resolves it with a safe decision", async () => {
    const repository = await temporaryRepository();
    const decisions: AcceptedDecision[] = [
      outcome(),
      { id: "project.technologies", value: ["Elixir"] },
      { id: "project.constraints", value: [] },
      { id: "project.risks", value: [] }
    ];
    const unresolved = await runProjectArchitect(repository.root, {
      mode: "new",
      scope: "engineering",
      acceptedDecisions: decisions
    });
    expect(unresolved.ok).toBe(true);
    if (unresolved.ok) {
      expect(unresolved.value.questions.map((question) => question.id)).toEqual([
        "project.manifestPath"
      ]);
    }
    const resolved = await runProjectArchitect(repository.root, {
      mode: "new",
      scope: "engineering",
      acceptedDecisions: [...decisions, { id: "project.manifestPath", value: "mix.exs" }]
    });
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.value.questions).toEqual([]);
      expect(resolved.value.plannedChanges).toContainEqual(
        expect.objectContaining({ path: "mix.exs", action: "create" })
      );
    }
  });

  it("uses one conflict decision per duplicate specification target", async () => {
    const repository = await temporaryRepository({
      "specs/active/SPEC-X.md": "| ID | SPEC-X |\n| Status | active |",
      "specs/ready/SPEC-X-copy.md": "| ID | SPEC-X |\n| Status | ready |"
    });
    const result = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      scope: "governance"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const specChanges = result.value.plannedChanges.filter((item) => item.path.includes("SPEC-X"));
    expect(specChanges).toHaveLength(2);
    expect(specChanges.every((item) => item.action === "conflict")).toBe(true);
    expect(new Set(result.value.plannedChanges.map((item) => item.path)).size).toBe(
      result.value.plannedChanges.length
    );
  });

  it("rejects audit proposals defensively", async () => {
    const repository = await temporaryRepository({ "src/index.ts": establishedSource });
    const proposal = await proposalFor(repository);
    await expect(
      approveProposal(
        repository.root,
        { ...proposal, mode: "audit" } as unknown as EcosystemProposal,
        {
          confirmed: true,
          proposalRevision: proposal.revision,
          proposalFingerprint: proposal.proposalFingerprint,
          repositoryFingerprint: proposal.repositoryFingerprint
        }
      )
    ).resolves.toMatchObject({ ok: false, error: { code: "INVALID_ARGUMENT" } });
  });

  it("returns the complete stable top-level result contract for audit and proposals", async () => {
    const repository = await temporaryRepository({ "README.md": "# Project" });
    const audit = await runProjectArchitect(repository.root, { mode: "audit" });
    expect(audit.ok).toBe(true);
    if (audit.ok) {
      expect(audit.value).toMatchObject({
        assumptions: expect.any(Array),
        criticalJourneys: expect.any(Array),
        consideredComponents: expect.any(Array),
        plannedChanges: [],
        preservedPaths: expect.any(Array),
        conflicts: expect.any(Array),
        risks: expect.any(Array),
        validation: expect.any(Array),
        deferredWork: expect.any(Array),
        appliedChanges: []
      });
      expect(audit.value.proposal).toBeUndefined();
    }
    const proposed = await runProjectArchitect(repository.root, {
      mode: "new",
      scope: "governance",
      acceptedDecisions: decisionsForScope("governance")
    });
    expect(proposed.ok).toBe(true);
    if (proposed.ok && proposed.value.proposal !== undefined) {
      for (const key of [
        "facts",
        "findings",
        "assumptions",
        "questions",
        "criticalJourneys",
        "consideredComponents",
        "plannedChanges",
        "preservedPaths",
        "conflicts",
        "risks",
        "validation",
        "deferredWork"
      ] as const) {
        expect(proposed.value[key]).toEqual(proposed.value.proposal[key]);
      }
    }
  });
});

describe("second completion-review corrections", () => {
  it("excludes explicitly third-party skills from semantic truth and fingerprints", async () => {
    const repository = await temporaryRepository({
      ".agents/skills/project/SKILL.md":
        "# Project procedure\nRun the repository test command before completing work.",
      ".agents/skills/project/package.json":
        '{"name":"project","author":"Example team","repository":"https://example.test/project"}',
      ".agents/skills/vendor/SKILL.md":
        "# Installed procedure\nSee [missing dependency documentation](docs/missing.md).",
      ".agents/skills/vendor/package.json": '{"name":"vendor","devcharterOrigin":"third-party"}'
    });
    const first = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    expect(first.value.semanticallyInspectedPaths).toContain(".agents/skills/project/SKILL.md");
    expect(first.value.artifacts).toContainEqual(
      expect.objectContaining({
        path: ".agents/skills/project/SKILL.md",
        origin: "project",
        ownership: "project"
      })
    );
    expect(first.value.semanticallyInspectedPaths).not.toContain(".agents/skills/vendor/SKILL.md");
    expect(first.value.fingerprintInputs.excludedPaths).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ".agents/skills/vendor/SKILL.md",
          reason: "dependency"
        }),
        expect.objectContaining({
          path: ".agents/skills/vendor/package.json",
          reason: "dependency"
        })
      ])
    );
    expect(
      first.value.findings.some((item) =>
        item.evidence.some((entry) => entry.source.includes("skills/vendor"))
      )
    ).toBe(false);

    await repository.write(
      ".agents/skills/vendor/SKILL.md",
      "# Changed installed procedure\n[another missing path](docs/also-missing.md)."
    );
    const second = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(second.ok).toBe(true);
    if (second.ok)
      expect(second.value.repositoryFingerprint).toBe(first.value.repositoryFingerprint);
  });

  it("validates bounded commands across supported manifest ecosystems", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"scripts":{"verify":"vitest run"}}',
      "pyproject.toml": '[project]\nname = "demo"\ndependencies = ["pytest"]\n',
      "Cargo.toml": '[package]\nname = "demo"\nversion = "0.1.0"\n',
      "go.mod": "module example.test/demo\n",
      "pom.xml": "<project><modelVersion>4.0.0</modelVersion></project>",
      "README.md": [
        "Run `npm run verify`, `pnpm verify`, `yarn verify`, and `bun run verify`.",
        "Run `python -m pytest`, `cargo test`, `go test ./...`, and `mvn verify`."
      ].join("\n")
    });
    const result = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "engineering"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.findings.map((item) => item.code)).not.toEqual(
      expect.arrayContaining(["DOCUMENTED_COMMAND_MISSING", "COMMAND_VALIDATION_UNCERTAIN"])
    );
    expect(result.value.facts).toContainEqual(
      expect.objectContaining({ key: "engineering.commandAuthorities" })
    );
  });

  it("reports unsupported native commands as uncertainty instead of missing scripts", async () => {
    const repository = await temporaryRepository({
      "Cargo.toml": '[package]\nname = "demo"\nversion = "0.1.0"\n',
      "README.md": "Run `cargo custom-plugin` before release."
    });
    const result = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "engineering"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.findings).toContainEqual(
      expect.objectContaining({
        code: "COMMAND_VALIDATION_UNCERTAIN",
        confidence: "low",
        uncertainty: expect.any(String)
      })
    );
    expect(result.value.findings.map((item) => item.code)).not.toContain(
      "DOCUMENTED_COMMAND_MISSING"
    );
  });

  it.each(["npm run missing", "yarn missing", "bun run missing"])(
    "validates missing JavaScript package-manager scripts for %s",
    async (command) => {
      const repository = await temporaryRepository({
        "package.json": '{"scripts":{"test":"vitest run"}}',
        "README.md": `Run \`${command}\` before release.`
      });
      const result = await runProjectArchitect(repository.root, {
        mode: "audit",
        scope: "engineering"
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.findings).toContainEqual(
        expect.objectContaining({ code: "DOCUMENTED_COMMAND_MISSING" })
      );
    }
  );

  it("uses static Python script declarations as command and journey evidence", async () => {
    const repository = await temporaryRepository({
      "pyproject.toml": [
        "[project]",
        'name = "demo"',
        "[project.scripts]",
        'verify = "demo.cli:main"'
      ].join("\n"),
      "README.md": "Run `verify` before release."
    });
    const result = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "engineering"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.facts).toContainEqual(
      expect.objectContaining({
        key: "engineering.commandAuthorities",
        value: expect.arrayContaining([
          expect.objectContaining({ path: "pyproject.toml", scripts: ["verify"] })
        ])
      })
    );
    expect(result.value.criticalJourneys).toContainEqual(
      expect.objectContaining({ summary: expect.stringContaining("verify") })
    );
  });

  it("does not treat incidental Python tool prose as a static declaration", async () => {
    const repository = await temporaryRepository({
      "pyproject.toml": '[project]\nname = "demo"\ndescription = "pytest is not configured"\n',
      "README.md": "Run `python -m pytest` before release."
    });
    const result = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "engineering"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.findings).toContainEqual(
      expect.objectContaining({ code: "COMMAND_VALIDATION_UNCERTAIN" })
    );
  });

  it("treats Git history as corroboration rather than sufficient establishment evidence", async () => {
    const repository = await temporaryRepository({
      ".git/HEAD": "ref: refs/heads/main\n",
      "eslint.config.js": "export default [];"
    });
    const runner: GitRunner = async (_root, arguments_) => {
      const command = arguments_[arguments_.indexOf("core.untrackedCache=false") + 1];
      if (command === "rev-list") return "2\n";
      if (command === "status" || command === "ls-files") return "";
      if (arguments_.includes("--show-toplevel")) return repository.root + "\n";
      return "0123456789012345678901234567890123456789\n";
    };
    const result = await runProjectArchitect(
      repository.root,
      { mode: "audit" },
      { gitRunner: runner }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.recommendation).toMatchObject({
      recommendedMode: "new",
      confidence: "low"
    });
    expect(result.value.recommendation.signals).toContainEqual(
      expect.objectContaining({ kind: "meaningful-history", strength: "supporting" })
    );
    expect(
      result.value.recommendation.signals.some((signal) => signal.kind === "material-source")
    ).toBe(false);
  });

  it("does not treat completed historical specifications as current establishment evidence", async () => {
    const repository = await temporaryRepository({
      "specs/done/SPEC-OLD.md":
        "| ID | SPEC-OLD |\n| Status | done |\n" + "Historical implementation detail. ".repeat(100)
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.recommendation.recommendedMode).toBe("new");
  });

  it("derives developer and user journeys only from explicit repository evidence", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"scripts":{"test":"vitest run"}}',
      "docs/product.md": "# Product\n## User journey - Complete checkout\n",
      "tests/e2e/checkout.test.ts": 'test("customer completes checkout", async () => {});'
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "full" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.criticalJourneys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: expect.stringMatching(/^developer-/) }),
        expect.objectContaining({ summary: "Complete checkout" }),
        expect.objectContaining({ summary: "customer completes checkout" })
      ])
    );
    expect(
      result.value.criticalJourneys.every(
        (journey) => journey.evidence.length > 0 && journey.verification.trim() !== ""
      )
    ).toBe(true);
  });

  it("reports missing journey evidence only for established applicable scopes", async () => {
    const established = await temporaryRepository({ "src/main.py": establishedSource });
    const establishedResult = await runProjectArchitect(established.root, {
      mode: "audit",
      scope: "engineering"
    });
    expect(establishedResult.ok).toBe(true);
    if (establishedResult.ok) {
      expect(establishedResult.value.findings.map((item) => item.code)).toContain(
        "MISSING_CRITICAL_JOURNEY_EVIDENCE"
      );
    }

    const empty = await temporaryRepository();
    const emptyResult = await runProjectArchitect(empty.root, { mode: "audit" });
    expect(emptyResult.ok).toBe(true);
    if (emptyResult.ok) {
      expect(emptyResult.value.criticalJourneys).toEqual([]);
      expect(emptyResult.value.findings.map((item) => item.code)).not.toContain(
        "MISSING_CRITICAL_JOURNEY_EVIDENCE"
      );
    }
  });

  it("uses update for inadequate existing targets and skip only for adequate targets", async () => {
    const cases = [
      {
        scope: "governance" as const,
        path: "README.md",
        inadequate: "# Project",
        adequate:
          "# Product\nThis repository ships a dependable application and documents its current behavior, verification workflow, and maintenance expectations."
      },
      {
        scope: "engineering" as const,
        path: "package.json",
        inadequate: '{"scripts":{"test":""}}',
        adequate: '{"scripts":{"test":"vitest run"}}'
      },
      {
        scope: "ai" as const,
        path: "AGENTS.md",
        inadequate: "# Instructions",
        adequate:
          "# Instructions\nInspect repository context and run the relevant verification before completion."
      }
    ];
    for (const fixture of cases) {
      const inadequateRepository = await temporaryRepository({
        [fixture.path]: fixture.inadequate
      });
      const inadequate = await runProjectArchitect(inadequateRepository.root, {
        mode: "new",
        scope: fixture.scope,
        acceptedDecisions: decisionsForScope(fixture.scope)
      });
      expect(inadequate.ok && inadequate.value.plannedChanges).toContainEqual(
        expect.objectContaining({ path: fixture.path, action: "update" })
      );

      const adequateRepository = await temporaryRepository({ [fixture.path]: fixture.adequate });
      const adequate = await runProjectArchitect(adequateRepository.root, {
        mode: "new",
        scope: fixture.scope,
        acceptedDecisions: decisionsForScope(fixture.scope)
      });
      expect(adequate.ok && adequate.value.plannedChanges).toContainEqual(
        expect.objectContaining({ path: fixture.path, action: "skip" })
      );
    }
  });
});

describe("SPEC-0001B correction pass", () => {
  it("binds approval-relevant exclusion metadata into the repository fingerprint", () => {
    const base: RepositoryFingerprintInputs = {
      algorithmVersion: 2,
      scope: "engineering",
      includedPaths: [],
      excludedPaths: [
        {
          path: "src/large.ts",
          reason: "oversized",
          detail: "File exceeds 4194304 bytes",
          uncertainty: "Content changes are not represented in the fingerprint"
        }
      ],
      gitFacts: []
    };
    const original = computeRepositoryFingerprint(base);
    expect(computeRepositoryFingerprint({ ...base, excludedPaths: [] })).not.toBe(original);
    expect(
      computeRepositoryFingerprint({
        ...base,
        excludedPaths: [{ ...base.excludedPaths[0]!, detail: "Changed classification detail" }]
      })
    ).not.toBe(original);
    expect(
      computeRepositoryFingerprint({
        ...base,
        excludedPaths: [
          ...base.excludedPaths,
          {
            path: "src/other-large.ts",
            reason: "oversized",
            uncertainty: "Content changes are not represented in the fingerprint"
          }
        ]
      })
    ).not.toBe(original);
  });

  it("invalidates a scoped fingerprint when a relevant external symlink is added", async () => {
    const repository = await temporaryRepository({ "README.md": "# Project" });
    const outside = await temporaryRepository({ "external.md": "outside" });
    const before = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "governance"
    });
    await symlink(
      outside.root,
      path.join(repository.root, "docs"),
      process.platform === "win32" ? "junction" : "dir"
    );
    const after = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "governance"
    });
    expect(before.ok && after.ok).toBe(true);
    if (!before.ok || !after.ok) return;
    expect(after.value.fingerprintInputs.excludedPaths).toContainEqual(
      expect.objectContaining({ path: "docs", reason: "external-symlink" })
    );
    expect(after.value.repositoryFingerprint).not.toBe(before.value.repositoryFingerprint);
  });

  it("ignores secret-content and dependency/cache/generated churn", async () => {
    const repository = await temporaryRepository({
      "src/index.ts": establishedSource,
      ".env": "TOKEN=one",
      "node_modules/vendor/index.js": "one",
      ".cache/state.txt": "one",
      "dist/output.js": "one"
    });
    const before = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "engineering"
    });
    await repository.write(".env", "TOKEN=two");
    await repository.write("node_modules/vendor/index.js", "two");
    await repository.write(".cache/state.txt", "two");
    await repository.write("dist/output.js", "two");
    const after = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "engineering"
    });
    expect(before.ok && after.ok).toBe(true);
    if (before.ok && after.ok) {
      expect(after.value.repositoryFingerprint).toBe(before.value.repositoryFingerprint);
    }
  });

  it("does not stale governance for an out-of-scope source edit with unchanged classification", async () => {
    const repository = await temporaryRepository({
      "README.md":
        "# Project\n\n## Purpose\n\nShip a dependable local tool with documented behavior and predictable verification for maintainers.",
      "src/index.ts": establishedSource
    });
    const before = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "governance"
    });
    await repository.write("src/index.ts", establishedSource.replace("activate", "enable"));
    const after = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "governance"
    });
    expect(before.ok && after.ok).toBe(true);
    if (before.ok && after.ok) {
      expect(after.value.repositoryFingerprint).toBe(before.value.repositoryFingerprint);
      expect(after.value.fingerprintInputs.includedPaths).toContainEqual(
        expect.objectContaining({ path: "src/index.ts", reason: "mode-classification" })
      );
    }
  });

  it("canonicalizes equivalent fingerprint manifests", () => {
    const first: RepositoryFingerprintInputs = {
      algorithmVersion: 2,
      scope: "ai",
      includedPaths: [
        {
          path: "b.md",
          role: "ai",
          reason: "selected-scope",
          type: "text",
          digest: "b".repeat(64)
        },
        { path: "a.md", role: "ai", reason: "selected-scope", type: "text", digest: "a".repeat(64) }
      ],
      excludedPaths: [
        { path: "z.md", reason: "unsafe", detail: "line one\r\nline two", uncertainty: "uncertain" }
      ],
      gitFacts: [
        { name: "status", available: true, value: [] },
        { name: "root", available: true, value: "." }
      ]
    };
    const second: RepositoryFingerprintInputs = {
      ...first,
      includedPaths: [...first.includedPaths].reverse(),
      excludedPaths: [{ ...first.excludedPaths[0]!, detail: "line one\nline two" }],
      gitFacts: [...first.gitFacts].reverse()
    };
    expect(computeRepositoryFingerprint(first)).toBe(computeRepositoryFingerprint(second));
  });

  it("reports only content interpreted by defined analyzers as semantic inspection", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"scripts":{"test":"vitest run"},"dependencies":{"openai":"1"}}',
      "README.md":
        "# Project\n\nSee [architecture](docs/architecture.md) and `private/context.txt`.",
      "docs/architecture.md": "# Architecture\n\nCurrent architecture reference.",
      "private/context.txt": "Hash-only referenced context",
      "src/plain.ts": "export const harmless = 1;",
      "src/ai.ts": "import OpenAI from 'openai'; export const client = new OpenAI();"
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "full" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.semanticallyInspectedPaths).toEqual(
      expect.arrayContaining(["package.json", "README.md", "src/ai.ts"])
    );
    expect(result.value.semanticallyInspectedPaths).not.toContain("src/plain.ts");
    expect(result.value.semanticallyInspectedPaths).not.toContain("private/context.txt");
    expect(result.value.fingerprintInputs.includedPaths).toContainEqual(
      expect.objectContaining({ path: "src/plain.ts" })
    );
    expect(result.value.fingerprintInputs.includedPaths).toContainEqual(
      expect.objectContaining({ path: "private/context.txt", reason: "reference-dependency" })
    );
  });

  it("uses an unambiguous skills lock and remains conservative for invalid provenance", async () => {
    const repository = await temporaryRepository({
      ".agents/skills/installed/SKILL.md": "# Installed\nSee [missing](docs/missing.md).",
      ".agents/skills/local/SKILL.md": "# Local\nRun the project workflow.",
      ".agents/skills-lock.json": JSON.stringify({
        version: 1,
        skills: {
          installed: {
            path: ".agents/skills/installed",
            source: "github:example/installed-skill"
          }
        }
      })
    });
    const locked = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(locked.ok).toBe(true);
    if (!locked.ok) return;
    expect(
      locked.value.artifacts.find((item) => item.path.endsWith("installed/SKILL.md"))
    ).toMatchObject({
      origin: "third-party"
    });
    expect(
      locked.value.findings.some((item) =>
        item.evidence.some((entry) => entry.source.includes("installed"))
      )
    ).toBe(false);
    const fingerprint = locked.value.repositoryFingerprint;
    await repository.write(".agents/skills/installed/SKILL.md", "# Changed third-party content");
    const changedThirdParty = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "ai"
    });
    expect(changedThirdParty.ok && changedThirdParty.value.repositoryFingerprint).toBe(fingerprint);

    await repository.write(".agents/skills-lock.json", "{ invalid");
    const invalid = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(invalid.ok).toBe(true);
    if (!invalid.ok) return;
    expect(
      invalid.value.artifacts.find((item) => item.path.endsWith("installed/SKILL.md"))
    ).toMatchObject({
      origin: "project"
    });
    expect(
      invalid.value.assumptions.some((item) =>
        item.evidence?.some((entry) => entry.source === ".agents/skills-lock.json")
      )
    ).toBe(true);
  });

  it("changes the AI fingerprint when a relevant project-authored skill changes", async () => {
    const repository = await temporaryRepository({
      ".agents/skills/local/SKILL.md": "# Local procedure\nRun tests before completion."
    });
    const before = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    await repository.write(
      ".agents/skills/local/SKILL.md",
      "# Local procedure\nRun full verification before completion."
    );
    const after = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(before.ok && after.ok).toBe(true);
    if (before.ok && after.ok)
      expect(after.value.repositoryFingerprint).not.toBe(before.value.repositoryFingerprint);
  });

  it("infers a substantive current outcome but not a placeholder", async () => {
    const substantive = await temporaryRepository({
      "docs/product/purpose.md":
        "# Purpose\n\nProvide a dependable local package that audits repository evidence and proposes only the minimum useful development ecosystem."
    });
    const inferred = await runProjectArchitect(substantive.root, {
      mode: "new",
      scope: "governance"
    });
    expect(inferred.ok).toBe(true);
    if (inferred.ok)
      expect(inferred.value.questions.map((item) => item.id)).not.toContain("project.outcome");

    const placeholder = await temporaryRepository({
      "README.md": "# Project\n\n## Purpose\n\nTODO: describe product."
    });
    const unresolved = await runProjectArchitect(placeholder.root, {
      mode: "new",
      scope: "governance"
    });
    expect(unresolved.ok).toBe(true);
    if (unresolved.ok)
      expect(unresolved.value.questions.map((item) => item.id)).toContain("project.outcome");
  });

  it("asks a material constraint question only when repository evidence raises it", async () => {
    const ordinary = await temporaryRepository();
    const ordinaryResult = await runProjectArchitect(ordinary.root, {
      mode: "new",
      scope: "governance",
      acceptedDecisions: [outcome()]
    });
    expect(ordinaryResult.ok).toBe(true);
    if (ordinaryResult.ok) {
      expect(ordinaryResult.value.questions).toEqual([]);
      expect(ordinaryResult.value.assumptions.map((item) => item.summary)).toEqual(
        expect.arrayContaining([
          expect.stringContaining("No special project constraints"),
          expect.stringContaining("No special project risks")
        ])
      );
    }

    const constrained = await temporaryRepository({
      "docs/product/constraints.md":
        "# Platform constraints\n\nThe supported deployment platform and security compatibility requirements remain undecided."
    });
    const constrainedResult = await runProjectArchitect(constrained.root, {
      mode: "new",
      scope: "governance",
      acceptedDecisions: [outcome()]
    });
    expect(constrainedResult.ok).toBe(true);
    if (constrainedResult.ok) {
      expect(constrainedResult.value.questions).toContainEqual(
        expect.objectContaining({ id: "project.constraints", requiredForApproval: true })
      );
    }
  });

  it("allows approval without confirming evidence-backed empty defaults", async () => {
    const repository = await temporaryRepository();
    const proposal = await proposalFor(repository, [
      outcome(),
      { id: "project.technologies", value: ["TypeScript", "Node.js"] },
      { id: "project.aiTools", value: ["Codex"] },
      { id: "project.packageScripts", value: { test: "vitest run" } }
    ]);
    expect(proposal.questions).toEqual([]);
    const approved = await approveProposal(repository.root, proposal, {
      confirmed: true,
      proposalRevision: proposal.revision,
      proposalFingerprint: proposal.proposalFingerprint,
      repositoryFingerprint: proposal.repositoryFingerprint
    });
    expect(approved.ok).toBe(true);
  });

  it("keeps considered components empty without repository-specific evidence", async () => {
    const repository = await temporaryRepository();
    const result = await runProjectArchitect(repository.root, { mode: "audit" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.consideredComponents).toEqual([]);
  });

  it("prefers a root aggregate verification journey over package builds", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"scripts":{"verify":"pnpm -r test"}}',
      "packages/a/package.json": '{"scripts":{"build":"tsc"}}',
      "packages/b/package.json": '{"scripts":{"build":"tsc"}}'
    });
    const result = await runProjectArchitect(repository.root, {
      mode: "audit",
      scope: "engineering"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const developerJourneys = result.value.criticalJourneys.filter((item) =>
      item.id.startsWith("developer-")
    );
    expect(developerJourneys).toHaveLength(1);
    expect(developerJourneys[0]).toMatchObject({
      summary: expect.stringContaining("aggregate verify")
    });
    expect(developerJourneys[0]?.evidence[0]?.source).toBe("package.json");
  });
});

describe("read-only Git boundary", () => {
  it("uses only the fixed no-lock Git allowlist", async () => {
    const repository = await temporaryRepository({
      ".git/HEAD": "ref: refs/heads/main\n",
      "README.md": "# Project"
    });
    const calls: readonly string[][] = [];
    const mutableCalls = calls as string[][];
    const runner: GitRunner = async (_root, arguments_) => {
      mutableCalls.push([...arguments_]);
      const command = arguments_[arguments_.indexOf("core.untrackedCache=false") + 1];
      if (command === "status" || command === "ls-files") return "README.md\0";
      if (command === "rev-list") return "2\n";
      return repository.root + "\n";
    };
    const result = await runProjectArchitect(
      repository.root,
      { mode: "audit" },
      { gitRunner: runner }
    );
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(5);
    for (const arguments_ of calls) {
      expect(arguments_.slice(0, 7)).toEqual([
        "--no-optional-locks",
        "--no-pager",
        "-c",
        "core.fsmonitor=false",
        "-c",
        "core.untrackedCache=false",
        expect.any(String)
      ]);
    }
  });

  it("does not alter worktree or contained Git state on success", async () => {
    const repository = await temporaryRepository({ "README.md": "# Project" });
    await execFileAsync("git", ["init", "--quiet"], { cwd: repository.root, windowsHide: true });
    await execFileAsync("git", ["add", "README.md"], { cwd: repository.root, windowsHide: true });
    const before = await repository.snapshot();
    expect(before.some((entry) => entry.path === ".git/index")).toBe(true);
    const result = await runProjectArchitect(repository.root, { mode: "audit" });
    expect(result.ok).toBe(true);
    expect(await repository.snapshot()).toEqual(before);
  });

  it("reports Git failures without altering repository or Git state", async () => {
    const repository = await temporaryRepository({
      ".git/HEAD": "ref: refs/heads/main\n",
      ".git/index": "sentinel index",
      "README.md": "# Project"
    });
    const before = await repository.snapshot();
    const result = await runProjectArchitect(
      repository.root,
      { mode: "audit" },
      {
        gitRunner: async () => {
          throw new Error("injected Git failure");
        }
      }
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fingerprintInputs.gitFacts.every((fact) => !fact.available)).toBe(true);
    }
    expect(await repository.snapshot()).toEqual(before);
  });

  it("does not invoke Git for an external worktree pointer", async () => {
    const repository = await temporaryRepository({
      ".git": "gitdir: C:/outside/repository/.git/worktrees/project\n",
      "README.md": "# Project"
    });
    let invoked = false;
    const result = await runProjectArchitect(
      repository.root,
      { mode: "audit" },
      {
        gitRunner: async () => {
          invoked = true;
          return "";
        }
      }
    );
    expect(result.ok).toBe(true);
    expect(invoked).toBe(false);
    if (result.ok) {
      expect(result.value.fingerprintInputs.gitFacts).toContainEqual(
        expect.objectContaining({ available: false })
      );
    }
  });

  it("keeps every Project Architect module isolated from write and external side effects", async () => {
    const sources = await Promise.all(
      [
        "./project-architect.ts",
        "./project-architect/fingerprint.ts",
        "./project-architect/runtime-ai.ts",
        "./project-architect/skill-provenance.ts"
      ].map((path) => readFile(new URL(path, import.meta.url), "utf8"))
    );
    const source = sources.join("\n");

    expect(source).not.toMatch(
      /(?:from|import\s*)\s*[(]?\s*["'][^"']*(?:writer|adapter|generator|application)[^"']*["']/i
    );
    expect(source).not.toMatch(/node:(?:http|https|net)|\bfetch\s*\(|telemetry/i);
  });
});

describe("final SPEC-0001B runtime-AI fingerprint correction", () => {
  const openAiSource = `
import OpenAI from "openai";

export function createClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
`;
  const localSource = `
export function createClient() {
  const endpoint = "local";
  return { endpoint, ready: true, transport: "in-process", retries: 3 };
}
`;

  it("rejects the exact stale approval after runtime-AI import evidence disappears", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"dependencies":{"openai":"1.0.0"}}',
      "src/client.ts": openAiSource
    });
    const initial = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      scope: "ai"
    });
    expect(initial.ok).toBe(true);
    if (!initial.ok || initial.value.proposal === undefined) return;
    expect(initial.value.facts.map((fact) => fact.key)).toContain("ai.runtimeImplementation");
    const proposal = initial.value.proposal;
    const approval = {
      confirmed: true as const,
      proposalRevision: proposal.revision,
      proposalFingerprint: proposal.proposalFingerprint,
      repositoryFingerprint: proposal.repositoryFingerprint
    };

    await repository.write("src/client.ts", localSource);
    const changed = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      scope: "ai"
    });
    expect(changed.ok).toBe(true);
    if (!changed.ok) return;
    expect(changed.value.facts.map((fact) => fact.key)).not.toContain("ai.runtimeImplementation");
    expect(changed.value.repositoryFingerprint).not.toBe(proposal.repositoryFingerprint);
    await expect(approveProposal(repository.root, proposal, approval)).resolves.toMatchObject({
      ok: false,
      error: { code: "STALE_PROPOSAL" }
    });
  });

  it("changes AI fingerprints when matching imports are added, removed, or replaced", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"dependencies":{"openai":"1.0.0","@anthropic-ai/sdk":"1.0.0"}}',
      "src/client.ts": localSource
    });
    const local = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    await repository.write("src/client.ts", openAiSource);
    const openai = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    await repository.write(
      "src/client.ts",
      'import Anthropic from "@anthropic-ai/sdk";\nexport function createClient() { return new Anthropic({ apiKey: "test" }); }\n'
    );
    const anthropic = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    await repository.write("src/client.ts", localSource);
    const removed = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(local.ok && openai.ok && anthropic.ok && removed.ok).toBe(true);
    if (!local.ok || !openai.ok || !anthropic.ok || !removed.ok) return;
    expect(openai.value.repositoryFingerprint).not.toBe(local.value.repositoryFingerprint);
    expect(anthropic.value.repositoryFingerprint).not.toBe(openai.value.repositoryFingerprint);
    expect(removed.value.repositoryFingerprint).not.toBe(anthropic.value.repositoryFingerprint);
    expect(removed.value.repositoryFingerprint).toBe(local.value.repositoryFingerprint);
  });

  it("ignores unrelated AI-scoped source edits when canonical matching imports stay unchanged", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"dependencies":{"openai":"1.0.0"}}',
      "src/client.ts": openAiSource
    });
    const initial = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    await repository.write(
      "src/client.ts",
      `// Formatting and implementation changed without changing runtime-AI evidence.\n\nimport OpenAI from 'openai';\n\nexport function createClient() {\n  const retries = 5;\n  return { client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }), retries };\n}\n`
    );
    const changed = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(initial.ok && changed.ok).toBe(true);
    if (initial.ok && changed.ok) {
      expect(changed.value.repositoryFingerprint).toBe(initial.value.repositoryFingerprint);
    }
  });

  it("keeps dependency-only and import-only evidence unconfirmed", async () => {
    const dependencyOnly = await temporaryRepository({
      "package.json": '{"dependencies":{"openai":"1.0.0"}}',
      "src/client.ts": localSource
    });
    const importOnly = await temporaryRepository({ "src/client.ts": openAiSource });
    for (const repository of [dependencyOnly, importOnly]) {
      const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.facts.map((fact) => fact.key)).not.toContain(
          "ai.runtimeImplementation"
        );
      }
    }
  });

  it("retains full-scope complete source fingerprints", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"dependencies":{"openai":"1.0.0"}}',
      "src/client.ts": openAiSource
    });
    const initial = await runProjectArchitect(repository.root, { mode: "audit", scope: "full" });
    await repository.write(
      "src/client.ts",
      openAiSource.replace("return new OpenAI", "const marker = true; return new OpenAI")
    );
    const changed = await runProjectArchitect(repository.root, { mode: "audit", scope: "full" });
    expect(initial.ok && changed.ok).toBe(true);
    if (!initial.ok || !changed.ok) return;
    expect(initial.value.fingerprintInputs.includedPaths).toContainEqual(
      expect.objectContaining({ path: "src/client.ts", reason: "selected-scope" })
    );
    expect(changed.value.repositoryFingerprint).not.toBe(initial.value.repositoryFingerprint);
  });

  it("keeps repeated runtime-AI analysis deterministic", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"dependencies":{"openai":"1.0.0"}}',
      "src/client.ts": openAiSource
    });
    const first = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    const second = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(second).toEqual(first);
  });
});

describe("SPEC-0001B authoritative runtime-AI evidence correction", () => {
  it("does not create a runtime-AI fact from sibling package evidence", async () => {
    const repository = await temporaryRepository({
      "packages/a/package.json": '{"dependencies":{"openai":"1.0.0"}}',
      "packages/b/src/client.ts": 'import OpenAI from "openai";'
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.facts.map((fact) => fact.key)).not.toContain("ai.runtimeImplementation");
    expect(result.value.facts).toContainEqual(
      expect.objectContaining({ key: "ai.unusedOrUnconfirmedDependencies" })
    );
  });

  it("ignores comment and string examples in facts and AI fingerprints", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"dependencies":{"openai":"1.0.0"}}',
      "src/client.ts": [
        '// import OpenAI from "openai";',
        "const quoted = 'require(\"openai\")';",
        'const template = `await import("openai")`;'
      ].join("\n")
    });
    const initial = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(initial.ok).toBe(true);
    if (!initial.ok) return;
    expect(initial.value.facts.map((fact) => fact.key)).not.toContain("ai.runtimeImplementation");

    await repository.write(
      "src/client.ts",
      [
        '/* require("openai") */',
        "const quoted = \"import OpenAI from 'openai'\";",
        'const template = `multiline\\nimport("openai")`;'
      ].join("\n")
    );
    const changed = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(changed.ok).toBe(true);
    if (!changed.ok) return;
    expect(changed.value.facts.map((fact) => fact.key)).not.toContain("ai.runtimeImplementation");
    expect(changed.value.repositoryFingerprint).toBe(initial.value.repositoryFingerprint);
  });

  it("uses the nearer manifest for facts and AI fingerprints", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"dependencies":{"openai":"1.0.0"}}',
      "packages/app/package.json": '{"name":"app"}',
      "packages/app/src/client.ts": 'import OpenAI from "openai";'
    });
    const initial = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      scope: "ai",
      acceptedDecisions: decisionsForScope("ai")
    });
    expect(initial.ok).toBe(true);
    if (!initial.ok) return;
    expect(initial.value.facts.map((fact) => fact.key)).not.toContain("ai.runtimeImplementation");
    const initialFingerprint = initial.value.repositoryFingerprint;

    await repository.write(
      "packages/app/package.json",
      '{"name":"app","dependencies":{"openai":"1.0.0"}}'
    );
    const changed = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      scope: "ai",
      acceptedDecisions: decisionsForScope("ai")
    });
    expect(changed.ok).toBe(true);
    if (!changed.ok) return;
    expect(changed.value.facts.map((fact) => fact.key)).toContain("ai.runtimeImplementation");
    expect(changed.value.repositoryFingerprint).not.toBe(initialFingerprint);
  });
});

describe("SPEC-0001B conservative polyglot runtime-AI evidence", () => {
  const productionWithoutImport = `
export function createClient() {
  const endpoint = "local";
  return { endpoint, ready: true, transport: "in-process", retries: 3 };
}
`;
  const productionWithImport = `
import OpenAI from "openai";

export function createClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
`;
  it.each([
    {
      language: "Python",
      manifestPath: "pyproject.toml",
      manifest: '[project]\ndependencies = ["openai"]',
      sourcePath: "src/client.py",
      source: 'EXAMPLE = """\nimport openai\n"""'
    },
    {
      language: "Rust",
      manifestPath: "Cargo.toml",
      manifest: '[dependencies]\nasync-openai = "0.27"',
      sourcePath: "src/lib.rs",
      source: "/* use async_openai::Client; */"
    },
    {
      language: "Go",
      manifestPath: "go.mod",
      manifest: "module example.test/demo\nrequire github.com/sashabaranov/go-openai v1.40.1",
      sourcePath: "src/main.go",
      source: '// import "github.com/sashabaranov/go-openai"'
    },
    {
      language: "Java",
      manifestPath: "pom.xml",
      manifest:
        "<project><dependencies><dependency><groupId>com.openai</groupId><artifactId>openai-java</artifactId></dependency></dependencies></project>",
      sourcePath: "src/App.java",
      source: 'String example = "import com.openai.client.OpenAIClient;";'
    },
    {
      language: "Kotlin",
      manifestPath: "pom.xml",
      manifest:
        "<project><dependencies><dependency><groupId>com.anthropic</groupId><artifactId>anthropic-java</artifactId></dependency></dependencies></project>",
      sourcePath: "src/App.kt",
      source: 'val example = """\nimport com.anthropic.client.AnthropicClient\n"""'
    }
  ])("does not create a runtime fact from inactive $language imports", async (fixture) => {
    const repository = await temporaryRepository({
      [fixture.manifestPath]: fixture.manifest,
      [fixture.sourcePath]: fixture.source
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.facts.map((fact) => fact.key)).not.toContain("ai.runtimeImplementation");
    expect(result.value.facts.map((fact) => fact.key)).toContain(
      "ai.unusedOrUnconfirmedDependencies"
    );
  });

  it.each([
    ["keywords", '[project]\nkeywords = ["openai"]'],
    ["classifiers", '[project]\nclassifiers = ["openai"]'],
    ["tool array", '[tool.example]\npackages = ["openai"]']
  ])("does not authorize Python imports from %s", async (_name, manifest) => {
    const repository = await temporaryRepository({
      "pyproject.toml": manifest,
      "src/client.py": "import openai"
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.facts.map((fact) => fact.key)).not.toContain("ai.runtimeImplementation");
    }
  });

  it.each([
    {
      language: "JavaScript",
      manifestPath: "package.json",
      manifest: '{"dependencies":{"openai":"1"}}',
      testPath: "src/client.test.ts",
      testImport: 'import OpenAI from "openai";'
    },
    {
      language: "Python",
      manifestPath: "pyproject.toml",
      manifest: '[project]\ndependencies = ["openai"]',
      testPath: "tests/test_client.py",
      testImport: "import openai"
    }
  ])("does not treat a test-only $language import as product runtime AI", async (fixture) => {
    const repository = await temporaryRepository({
      [fixture.manifestPath]: fixture.manifest,
      [fixture.testPath]: fixture.testImport
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const runtimeFact = result.value.facts.find((fact) => fact.key === "ai.runtimeImplementation");
    expect(runtimeFact).toBeUndefined();
    expect(result.value.facts.map((fact) => fact.key)).toContain(
      "ai.unusedOrUnconfirmedDependencies"
    );
  });

  it("cites production evidence when production and test imports both exist", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"dependencies":{"openai":"1"}}',
      "src/client.ts": 'import OpenAI from "openai";',
      "src/client.test.ts": 'import OpenAI from "openai";'
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const runtimeFact = result.value.facts.find((fact) => fact.key === "ai.runtimeImplementation");
    expect(runtimeFact?.evidence).toContainEqual(
      expect.objectContaining({ source: "src/client.ts" })
    );
    expect(runtimeFact?.evidence).not.toContainEqual(
      expect.objectContaining({ source: "src/client.test.ts" })
    );
  });

  it("keeps test-only changes stable and changes AI identity when the import moves to production", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"dependencies":{"openai":"1"}}',
      "src/client.ts": productionWithoutImport,
      "src/client.test.ts": 'import OpenAI from "openai";'
    });
    const initial = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    await repository.write(
      "src/client.test.ts",
      '// changed test body\nimport OpenAI from "openai";\nconst expected = true;'
    );
    const testChanged = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    await repository.write("src/client.test.ts", "const expected = true;");
    await repository.write("src/client.ts", productionWithImport);
    const moved = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(initial.ok && testChanged.ok && moved.ok).toBe(true);
    if (!initial.ok || !testChanged.ok || !moved.ok) return;
    expect(testChanged.value.repositoryFingerprint).toBe(initial.value.repositoryFingerprint);
    expect(moved.value.repositoryFingerprint).not.toBe(initial.value.repositoryFingerprint);
    expect(moved.value.facts.map((fact) => fact.key)).toContain("ai.runtimeImplementation");
  });

  it.each(["@types/openai", "openai-mock", "not-openai"])(
    "does not let lookalike dependency %s authorize an openai import",
    async (dependency) => {
      const repository = await temporaryRepository({
        "package.json": JSON.stringify({ dependencies: { [dependency]: "1" } }),
        "src/client.ts": 'import OpenAI from "openai";'
      });
      const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.facts.map((fact) => fact.key)).not.toContain(
          "ai.runtimeImplementation"
        );
      }
    }
  );

  it("keeps inactive metadata and lookalike declarations out of the AI fingerprint", async () => {
    const python = await temporaryRepository({
      "pyproject.toml": '[project]\nname = "demo"',
      "src/client.py": "import openai"
    });
    const pythonInitial = await runProjectArchitect(python.root, { mode: "audit", scope: "ai" });
    await python.write(
      "pyproject.toml",
      '[project]\nname = "demo"\nkeywords = ["openai"]\nclassifiers = ["openai"]'
    );
    const pythonChanged = await runProjectArchitect(python.root, { mode: "audit", scope: "ai" });

    const javascript = await temporaryRepository({
      "package.json": '{"name":"demo"}',
      "src/client.ts": 'import OpenAI from "openai";'
    });
    const javascriptInitial = await runProjectArchitect(javascript.root, {
      mode: "audit",
      scope: "ai"
    });
    await javascript.write("package.json", '{"name":"demo","devDependencies":{"not-openai":"1"}}');
    const javascriptChanged = await runProjectArchitect(javascript.root, {
      mode: "audit",
      scope: "ai"
    });
    expect(
      pythonInitial.ok && pythonChanged.ok && javascriptInitial.ok && javascriptChanged.ok
    ).toBe(true);
    if (!pythonInitial.ok || !pythonChanged.ok || !javascriptInitial.ok || !javascriptChanged.ok) {
      return;
    }
    expect(pythonChanged.value.repositoryFingerprint).toBe(
      pythonInitial.value.repositoryFingerprint
    );
    expect(javascriptChanged.value.repositoryFingerprint).toBe(
      javascriptInitial.value.repositoryFingerprint
    );
  });

  it("keeps an approval current across inactive, test-only, metadata, and lookalike changes", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"dependencies":{"openai":"1"}}',
      "pyproject.toml": '[project]\nname = "demo"',
      "src/client.ts": '// import OpenAI from "openai";',
      "src/client.test.ts": "const expected = true;",
      "src/client.py": "import openai"
    });
    const initial = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      scope: "ai"
    });
    expect(initial.ok).toBe(true);
    if (!initial.ok || initial.value.proposal === undefined) return;
    const proposal = initial.value.proposal;
    expect(proposal.questions.filter((question) => question.requiredForApproval)).toEqual([]);
    expect(proposal.plannedChanges.length).toBeGreaterThan(0);

    await repository.write("src/client.ts", 'const example = `import("openai")`;');
    await repository.write("src/client.test.ts", 'import OpenAI from "openai";');
    await repository.write(
      "package.json",
      '{"dependencies":{"openai":"1"},"devDependencies":{"not-openai":"1"}}'
    );
    await repository.write("pyproject.toml", '[project]\nname = "demo"\nkeywords = ["openai"]');

    await expect(
      approveProposal(repository.root, proposal, {
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      })
    ).resolves.toEqual({ ok: true, value: { ...proposal, approved: true } });
  });
});

describe("final SPEC-0001B Maven dependency authority correction", () => {
  const javaImport = "import com.openai.client.OpenAIClient;\nclass App {}";
  const kotlinImport = "import com.openai.client.OpenAIClient\nclass App";
  const directDependency = `
    <dependency>
      <groupId>com.openai</groupId>
      <artifactId>openai-java</artifactId>
    </dependency>`;
  const directPom = `<project><dependencies>${directDependency}</dependencies></project>`;
  const invalidPomFixtures = [
    [
      "duplicate attributes",
      `<project duplicate="first" duplicate="second"><dependencies>${directDependency}</dependencies></project>`
    ],
    [
      "undeclared entity",
      `<project><name>&example;</name><dependencies>${directDependency}</dependencies></project>`
    ],
    [
      "unbound namespace prefix",
      `<project><m:dependencies>${directDependency}</m:dependencies></project>`
    ],
    [
      "foreign non-Maven namespace",
      `<project xmlns:foreign="https://example.com/schema"><foreign:dependencies>${directDependency}</foreign:dependencies></project>`
    ]
  ] as const;
  const runtimeFact = (facts: readonly { key: string }[]): { key: string } | undefined =>
    facts.find((fact) => fact.key === "ai.runtimeImplementation");

  it.each([
    [
      "commented",
      `<project><!-- <dependencies>${directDependency}</dependencies> --></project>`,
      "src/App.java",
      javaImport
    ],
    [
      "dependency-management",
      `<project><dependencyManagement><dependencies>${directDependency}</dependencies></dependencyManagement></project>`,
      "src/App.java",
      javaImport
    ],
    [
      "build-plugin",
      `<project><build><plugins><plugin><dependencies>${directDependency}</dependencies></plugin></plugins></build></project>`,
      "src/App.java",
      javaImport
    ],
    [
      "profile-only",
      `<project><profiles><profile><dependencies>${directDependency}</dependencies></profile></profiles></project>`,
      "src/App.kt",
      kotlinImport
    ],
    [
      "test-scoped",
      `<project><dependencies>${directDependency.replace("</dependency>", "<scope>test</scope></dependency>")}</dependencies></project>`,
      "src/App.java",
      javaImport
    ]
  ])(
    "does not confirm runtime AI from a %s Maven declaration",
    async (_name, manifest, sourcePath, source) => {
      const repository = await temporaryRepository({ "pom.xml": manifest, [sourcePath]: source });
      const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(runtimeFact(result.value.facts)).toBeUndefined();
      expect(result.value.facts.map((fact) => fact.key)).not.toContain(
        "ai.unusedOrUnconfirmedDependencies"
      );
    }
  );

  it("confirms a direct Maven dependency only from production evidence", async () => {
    const repository = await temporaryRepository({
      "pom.xml": directPom,
      "src/App.java": javaImport,
      "src/test/java/AppTest.java": javaImport
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.facts).toContainEqual(
      expect.objectContaining({
        key: "ai.runtimeImplementation",
        confidence: "high",
        evidence: expect.arrayContaining([
          expect.objectContaining({ source: "pom.xml" }),
          expect.objectContaining({ source: "src/App.java" })
        ])
      })
    );
    const fact = result.value.facts.find((item) => item.key === "ai.runtimeImplementation");
    expect(fact?.evidence).not.toContainEqual(
      expect.objectContaining({ source: "src/test/java/AppTest.java" })
    );
  });

  it("keeps a direct dependency with only a test import unconfirmed", async () => {
    const repository = await temporaryRepository({
      "pom.xml": directPom,
      "src/test/java/AppTest.java": javaImport
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(runtimeFact(result.value.facts)).toBeUndefined();
    expect(result.value.facts).toContainEqual(
      expect.objectContaining({ key: "ai.unusedOrUnconfirmedDependencies" })
    );
  });

  it.each(invalidPomFixtures)("produces no Maven evidence for %s", async (_name, manifest) => {
    const repository = await temporaryRepository({
      "pom.xml": manifest,
      "src/App.java": javaImport
    });
    const result = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(runtimeFact(result.value.facts)).toBeUndefined();
    expect(result.value.facts.map((fact) => fact.key)).not.toContain(
      "ai.unusedOrUnconfirmedDependencies"
    );
  });

  it("keeps AI facts and fingerprints stable across invalid Maven XML changes", async () => {
    const repository = await temporaryRepository({
      "pom.xml": invalidPomFixtures[0][1],
      "src/App.java": javaImport
    });
    const first = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    await repository.write("pom.xml", invalidPomFixtures[1][1]);
    const second = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(runtimeFact(first.value.facts)).toBeUndefined();
    expect(runtimeFact(second.value.facts)).toBeUndefined();
    expect(second.value.repositoryFingerprint).toBe(first.value.repositoryFingerprint);
  });

  it("keeps approval current across invalid Maven XML changes", async () => {
    const repository = await temporaryRepository({
      "pom.xml": invalidPomFixtures[2][1],
      "src/App.java": javaImport
    });
    const initial = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      scope: "ai",
      acceptedDecisions: [...decisionsForScope("ai"), { id: "project.mode", value: "retrofit" }]
    });
    expect(initial.ok).toBe(true);
    if (!initial.ok || initial.value.proposal === undefined) return;
    const proposal = initial.value.proposal;
    await repository.write("pom.xml", invalidPomFixtures[3][1]);
    await expect(
      approveProposal(repository.root, proposal, {
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      })
    ).resolves.toEqual({ ok: true, value: { ...proposal, approved: true } });
  });

  it("stales approval when invalid Maven XML becomes a valid direct dependency", async () => {
    const repository = await temporaryRepository({
      "pom.xml": invalidPomFixtures[0][1],
      "src/App.java": javaImport
    });
    const initial = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      scope: "ai",
      acceptedDecisions: [...decisionsForScope("ai"), { id: "project.mode", value: "retrofit" }]
    });
    expect(initial.ok).toBe(true);
    if (!initial.ok || initial.value.proposal === undefined) return;
    const proposal = initial.value.proposal;
    await repository.write("pom.xml", directPom);
    await expect(
      approveProposal(repository.root, proposal, {
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      })
    ).resolves.toMatchObject({ ok: false, error: { code: "STALE_PROPOSAL" } });
  });

  it.each([
    [
      "comments",
      `<project><!-- <dependencies>${directDependency}</dependencies> --></project>`,
      `<project><!-- changed ${directDependency}</project> --> </project>`
    ],
    [
      "CDATA",
      `<project><description><![CDATA[<dependencies>${directDependency}</dependencies>]]></description></project>`,
      `<project><description><![CDATA[changed <dependency>${directDependency}</dependency>]]></description></project>`
    ],
    [
      "dependency management",
      `<project><dependencyManagement><dependencies>${directDependency}</dependencies></dependencyManagement></project>`,
      `<project><dependencyManagement><dependencies>${directDependency.replace("openai-java", "openai-java-client-okhttp")}</dependencies></dependencyManagement></project>`
    ],
    [
      "plugins",
      `<project><build><plugins><plugin><dependencies>${directDependency}</dependencies></plugin></plugins></build></project>`,
      `<project><build><plugins><plugin><dependencies>${directDependency.replace("openai-java", "openai-java-core")}</dependencies></plugin></plugins></build></project>`
    ],
    [
      "profiles",
      `<project><profiles><profile><dependencies>${directDependency}</dependencies></profile></profiles></project>`,
      `<project><profiles><profile><dependencies>${directDependency.replace("openai-java", "openai-java-client-okhttp")}</dependencies></profile></profiles></project>`
    ],
    [
      "test scope",
      `<project><dependencies>${directDependency.replace("</dependency>", "<scope>test</scope></dependency>")}</dependencies></project>`,
      `<project><dependencies>${directDependency.replace("</dependency>", "<scope>test</scope><version>2</version></dependency>")}</dependencies></project>`
    ]
  ])("keeps the AI fingerprint stable across ignored %s changes", async (_name, before, after) => {
    const repository = await temporaryRepository({ "pom.xml": before, "src/App.java": javaImport });
    const initial = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    await repository.write("pom.xml", after);
    const changed = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(initial.ok && changed.ok).toBe(true);
    if (!initial.ok || !changed.ok) return;
    expect(changed.value.repositoryFingerprint).toBe(initial.value.repositoryFingerprint);
    expect(runtimeFact(changed.value.facts)).toBeUndefined();
  });

  it("changes the AI fingerprint when a supported dependency moves into or out of direct dependencies", async () => {
    const managedPom = `<project><dependencyManagement><dependencies>${directDependency}</dependencies></dependencyManagement></project>`;
    const repository = await temporaryRepository({
      "pom.xml": managedPom,
      "src/App.java": javaImport
    });
    const managed = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    await repository.write("pom.xml", directPom);
    const direct = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    await repository.write("pom.xml", "<project />");
    const removed = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(managed.ok && direct.ok && removed.ok).toBe(true);
    if (!managed.ok || !direct.ok || !removed.ok) return;
    expect(direct.value.repositoryFingerprint).not.toBe(managed.value.repositoryFingerprint);
    expect(removed.value.repositoryFingerprint).not.toBe(direct.value.repositoryFingerprint);
  });

  it("rejects approval after a direct Maven dependency/import change", async () => {
    const repository = await temporaryRepository({
      "pom.xml": "<project />",
      "src/App.java": javaImport
    });
    const initial = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      scope: "ai",
      acceptedDecisions: [...decisionsForScope("ai"), { id: "project.mode", value: "retrofit" }]
    });
    expect(initial.ok).toBe(true);
    if (!initial.ok || initial.value.proposal === undefined) return;
    const proposal = initial.value.proposal;
    await repository.write("pom.xml", directPom);
    await expect(
      approveProposal(repository.root, proposal, {
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      })
    ).resolves.toMatchObject({ ok: false, error: { code: "STALE_PROPOSAL" } });
  });

  it("keeps approval current after an ignored Maven-only change", async () => {
    const before = `<project><dependencyManagement><dependencies>${directDependency}</dependencies></dependencyManagement></project>`;
    const repository = await temporaryRepository({ "pom.xml": before, "src/App.java": javaImport });
    const initial = await runProjectArchitect(repository.root, {
      mode: "retrofit",
      scope: "ai",
      acceptedDecisions: [...decisionsForScope("ai"), { id: "project.mode", value: "retrofit" }]
    });
    expect(initial.ok).toBe(true);
    if (!initial.ok || initial.value.proposal === undefined) return;
    const proposal = initial.value.proposal;
    await repository.write("pom.xml", before.replace("openai-java", "openai-java-core"));
    await expect(
      approveProposal(repository.root, proposal, {
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      })
    ).resolves.toEqual({ ok: true, value: { ...proposal, approved: true } });
  });

  it("returns identical Maven facts, evidence ordering, and fingerprints repeatedly", async () => {
    const repository = await temporaryRepository({
      "pom.xml": directPom,
      "src/App.java": javaImport,
      "src/App.kt": kotlinImport
    });
    const first = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    const second = await runProjectArchitect(repository.root, { mode: "audit", scope: "ai" });
    expect(second).toEqual(first);
  });
});

describe("final SPEC-0001B contextual question correction", () => {
  it.each([
    "This project helps teams improve security documentation by collecting and presenting clear repository guidance for developers and maintainers.",
    "This application provides risk-management dashboards that help teams understand operational trends and communicate progress.",
    "This library creates database migration tooling for developers who maintain evolving application schemas across environments.",
    "The documentation compares Windows and Linux development communities and presents their common collaboration practices."
  ])("does not turn product-domain vocabulary into a material question", async (statement) => {
    const repository = await temporaryRepository({
      "docs/product/purpose.md": `# Purpose\n\n${statement}`
    });
    const result = await runProjectArchitect(repository.root, {
      mode: "new",
      scope: "governance"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.questions.map((question) => question.id)).not.toEqual(
      expect.arrayContaining(["project.constraints", "project.risks"])
    );
  });

  it.each([
    [
      "constraint",
      "## Platform constraints\n\nThe application must support Windows and Linux. macOS compatibility remains undecided.",
      "project.constraints"
    ],
    [
      "security requirement",
      "## Security requirements\n\nAll local credentials must remain outside generated files.",
      "project.constraints"
    ],
    [
      "risk",
      "## Risks\n\nData loss is possible during migration and the recovery behavior remains undecided.",
      "project.risks"
    ],
    [
      "compatibility",
      "## Compatibility\n\nThe package only supports Node.js 20 and cannot run on older releases.",
      "project.constraints"
    ]
  ])("asks a contextual question for an explicit %s", async (_name, documentation, questionId) => {
    const repository = await temporaryRepository({
      "docs/product/purpose.md": `# Purpose\n\nProvide a dependable repository tool for maintainers and developers.\n\n${documentation}`
    });
    const result = await runProjectArchitect(repository.root, {
      mode: "new",
      scope: "governance"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.questions).toContainEqual(
      expect.objectContaining({
        id: questionId,
        requiredForApproval: true,
        context: expect.stringContaining("Detected")
      })
    );
  });

  it("blocks unresolved contextual questions and accepts corresponding decisions", async () => {
    const repository = await temporaryRepository({
      "docs/product/purpose.md":
        "# Purpose\n\nProvide a dependable repository tool for maintainers and developers.\n\n## Compatibility\n\nThe package only supports Node.js 20.\n\n## Risks\n\nData loss is possible during migration."
    });
    const unresolved = await runProjectArchitect(repository.root, {
      mode: "new",
      scope: "governance"
    });
    expect(unresolved.ok).toBe(true);
    if (!unresolved.ok || unresolved.value.proposal === undefined) return;
    expect(unresolved.value.questions.map((question) => question.id)).toEqual(
      expect.arrayContaining(["project.constraints", "project.risks"])
    );
    const proposal = unresolved.value.proposal;
    await expect(
      approveProposal(repository.root, proposal, {
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      })
    ).resolves.toMatchObject({ ok: false, error: { code: "APPROVAL_REQUIRED" } });

    const resolved = await runProjectArchitect(repository.root, {
      mode: "new",
      scope: "governance",
      acceptedDecisions: [
        { id: "project.constraints", value: ["Support Node.js 20"] },
        { id: "project.risks", value: ["Protect recovery during migration"] }
      ]
    });
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      const questionIds = resolved.value.questions.map((question) => question.id);
      expect(questionIds).not.toContain("project.constraints");
      expect(questionIds).not.toContain("project.risks");
    }
  });
});
