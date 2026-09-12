import { execFile } from "node:child_process";
import { mkdir, readFile, symlink, unlink, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { applyRenderedProposal } from "./application.js";
import { computeProposalFingerprint, runProjectArchitect } from "./project-architect.js";
import { renderProposal, type EcosystemAdapter } from "./rendering.js";
import { captureRetryState } from "./retry-state.js";
import { success } from "./results.js";
import { createTemporaryRepository } from "./testing.js";

const execFileAsync = promisify(execFile);

const adapter: EcosystemAdapter = {
  id: "codex",
  async renderChange({ existingContent }) {
    return success(
      existingContent === undefined
        ? "# Instructions\n\nPreserve the project.\n"
        : existingContent + "\n## Added\n\nPreserve the project.\n"
    );
  }
};

async function plan(files: Record<string, string> = {}) {
  const repository = await createTemporaryRepository(files);
  const result = await runProjectArchitect(repository.root, {
    mode: "new",
    scope: "ai",
    acceptedDecisions: [
      { id: "project.outcome", value: "Test the renderer" },
      { id: "project.aiTools", value: ["Codex"] }
    ]
  });
  if (!result.ok || result.value.proposal === undefined) throw new Error("proposal failed");
  const proposal = result.value.proposal;
  return { repository, proposal };
}

async function renderManagedPlan(files: Record<string, string> = {}) {
  const { repository, proposal } = await plan(files);
  const managedProposal = {
    ...proposal,
    plannedChanges: proposal.plannedChanges.map((item) => ({
      ...item,
      ownership: "devcharter-managed" as const
    })),
    proposalFingerprint: "pending"
  };
  managedProposal.proposalFingerprint = computeProposalFingerprint(managedProposal);
  const rendered = await renderProposal(
    repository.root,
    managedProposal,
    {
      stage: "abstract",
      confirmed: true,
      proposalRevision: managedProposal.revision,
      proposalFingerprint: managedProposal.proposalFingerprint,
      repositoryFingerprint: managedProposal.repositoryFingerprint
    },
    adapter
  );
  if (!rendered.ok) throw new Error(rendered.error.message);
  return { repository, rendered: rendered.value };
}

describe("render and application boundaries", () => {
  it("renders deterministically, applies once, and detects an exact already-applied retry", async () => {
    const { repository, proposal } = await plan();
    const approval = {
      stage: "abstract" as const,
      confirmed: true as const,
      proposalRevision: proposal.revision,
      proposalFingerprint: proposal.proposalFingerprint,
      repositoryFingerprint: proposal.repositoryFingerprint
    };
    const first = await renderProposal(repository.root, proposal, approval, adapter);
    const second = await renderProposal(repository.root, proposal, approval, adapter);
    expect(first).toEqual(second);
    if (!first.ok) throw new Error(first.error.message);
    const writeApproval = {
      stage: "write" as const,
      confirmed: true as const,
      proposalRevision: first.value.revision,
      renderedFingerprint: first.value.renderedFingerprint,
      repositoryFingerprint: first.value.repositoryFingerprint
    };
    const applied = await applyRenderedProposal(repository.root, first.value, writeApproval);
    expect(applied).toMatchObject({ ok: true, value: { outcome: "applied" } });
    const retry = await applyRenderedProposal(repository.root, first.value, writeApproval);
    expect(retry).toEqual({
      ok: true,
      value: {
        outcome: "already-applied",
        appliedChanges: [
          {
            path: "AGENTS.md",
            outcome: "skipped",
            detail: "Already matches the rendered plan"
          }
        ],
        changedPaths: [],
        failures: [],
        validation: ["All rendered targets and managed metadata already match"]
      }
    });
    await repository.cleanup();
  });

  it("rejects an already-applied retry after an unrelated symlink is added", async () => {
    const { repository, proposal } = await plan();
    const rendered = await renderProposal(
      repository.root,
      proposal,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      },
      adapter
    );
    if (!rendered.ok) throw new Error(rendered.error.message);
    const approval = {
      stage: "write" as const,
      confirmed: true as const,
      proposalRevision: rendered.value.revision,
      renderedFingerprint: rendered.value.renderedFingerprint,
      repositoryFingerprint: rendered.value.repositoryFingerprint
    };
    await applyRenderedProposal(repository.root, rendered.value, approval);
    await symlink("AGENTS.md", `${repository.root}/unrelated-link.md`, "file");
    const retry = await applyRenderedProposal(repository.root, rendered.value, approval);
    expect(retry).toMatchObject({ ok: false, error: { code: "STALE_PROPOSAL" } });
    await repository.cleanup();
  });

  it("binds symlink targets as metadata without following them", async () => {
    const repository = await createTemporaryRepository({
      "first.txt": "one",
      "second.txt": "two"
    });
    const linkPath = `${repository.root}/link.txt`;
    await symlink("first.txt", linkPath, "file");
    const first = await captureRetryState(repository.root, []);
    await unlink(linkPath);
    await symlink("second.txt", linkPath, "file");
    const second = await captureRetryState(repository.root, []);
    expect(first).toMatchObject({ ok: true, value: { exact: true } });
    expect(second).toMatchObject({ ok: true, value: { exact: true } });
    if (!first.ok || !second.ok) throw new Error("retry capture failed");
    expect(second.value.digest).not.toBe(first.value.digest);
    await repository.cleanup();
  });

  it("rejects already-applied when Git HEAD changes even if target status is excluded", async () => {
    const repository = await createTemporaryRepository({});
    await execFileAsync("git", ["init", "--quiet"], { cwd: repository.root, windowsHide: true });
    const refreshed = await runProjectArchitect(repository.root, {
      mode: "new",
      scope: "ai",
      acceptedDecisions: [
        { id: "project.outcome", value: "Test the renderer" },
        { id: "project.aiTools", value: ["Codex"] }
      ]
    });
    if (!refreshed.ok || refreshed.value.proposal === undefined) throw new Error("proposal failed");
    const current = refreshed.value.proposal;
    const rendered = await renderProposal(
      repository.root,
      current,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: current.revision,
        proposalFingerprint: current.proposalFingerprint,
        repositoryFingerprint: current.repositoryFingerprint
      },
      adapter
    );
    if (!rendered.ok) throw new Error(rendered.error.message);
    const approval = {
      stage: "write" as const,
      confirmed: true as const,
      proposalRevision: rendered.value.revision,
      renderedFingerprint: rendered.value.renderedFingerprint,
      repositoryFingerprint: rendered.value.repositoryFingerprint
    };
    await applyRenderedProposal(repository.root, rendered.value, approval);
    await execFileAsync("git", ["add", "AGENTS.md"], { cwd: repository.root, windowsHide: true });
    await execFileAsync(
      "git",
      [
        "-c",
        "user.name=DevCharter",
        "-c",
        "user.email=test@example.invalid",
        "commit",
        "--quiet",
        "-m",
        "state"
      ],
      { cwd: repository.root, windowsHide: true }
    );
    const retry = await applyRenderedProposal(repository.root, rendered.value, approval);
    expect(retry).toMatchObject({ ok: false, error: { code: "STALE_PROPOSAL" } });
    await repository.cleanup();
  });

  it("does not claim exact already-applied state when bounded content was excluded", async () => {
    const { repository, proposal } = await plan({ "asset.bin": "binary" });
    const rendered = await renderProposal(
      repository.root,
      proposal,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      },
      adapter
    );
    if (!rendered.ok) throw new Error(rendered.error.message);
    expect(rendered.value.retryState.exact).toBe(false);
    const approval = {
      stage: "write" as const,
      confirmed: true as const,
      proposalRevision: rendered.value.revision,
      renderedFingerprint: rendered.value.renderedFingerprint,
      repositoryFingerprint: rendered.value.repositoryFingerprint
    };
    await applyRenderedProposal(repository.root, rendered.value, approval);
    const retry = await applyRenderedProposal(repository.root, rendered.value, approval);
    expect(retry).toMatchObject({ ok: false, error: { code: "STALE_PROPOSAL" } });
    await repository.cleanup();
  });

  it("rejects wrong-stage authorization and unrelated changes after application", async () => {
    const { repository, proposal } = await plan();
    const rendered = await renderProposal(
      repository.root,
      proposal,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      },
      adapter
    );
    if (!rendered.ok) throw new Error(rendered.error.message);
    const approval = {
      stage: "write" as const,
      confirmed: true as const,
      proposalRevision: rendered.value.revision,
      renderedFingerprint: rendered.value.renderedFingerprint,
      repositoryFingerprint: rendered.value.repositoryFingerprint
    };
    await applyRenderedProposal(repository.root, rendered.value, approval);
    await repository.write("unrelated.txt", "changed");
    const retry = await applyRenderedProposal(repository.root, rendered.value, approval);
    expect(retry).toMatchObject({ ok: false, error: { code: "STALE_PROPOSAL" } });
    await repository.cleanup();
  });

  it("preserves BOM, CRLF, and terminal-newline convention for updates", async () => {
    const { repository, proposal } = await plan({
      "AGENTS.md": "\ufeff# Existing\r\n\r\nKeep me.\r\n"
    });
    const changed = {
      ...proposal,
      plannedChanges: proposal.plannedChanges.map((item) =>
        item.path === "AGENTS.md"
          ? { ...item, action: "update" as const, content: undefined }
          : item
      ),
      proposalFingerprint: "pending"
    };
    changed.proposalFingerprint = computeProposalFingerprint(changed);
    const rendered = await renderProposal(
      repository.root,
      changed,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: changed.revision,
        proposalFingerprint: changed.proposalFingerprint,
        repositoryFingerprint: changed.repositoryFingerprint
      },
      adapter
    );
    if (!rendered.ok) throw new Error(rendered.error.message);
    const content = rendered.value.changes.find((item) => item.path === "AGENTS.md")?.content;
    expect(content?.startsWith("\ufeff")).toBe(true);
    expect(content).not.toMatch(/(?<!\r)\n/);
    expect(content?.endsWith("\r\n")).toBe(true);
    expect(content).toContain("Keep me.");
    await repository.cleanup();
  });

  it("preserves LF without BOM and the absence of a terminal newline", async () => {
    const { repository, proposal } = await plan({ "AGENTS.md": "# Existing\n\nKeep me." });
    const changed = {
      ...proposal,
      plannedChanges: proposal.plannedChanges.map((item) =>
        item.path === "AGENTS.md"
          ? { ...item, action: "update" as const, content: undefined }
          : item
      ),
      proposalFingerprint: "pending"
    };
    changed.proposalFingerprint = computeProposalFingerprint(changed);
    const rendered = await renderProposal(
      repository.root,
      changed,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: changed.revision,
        proposalFingerprint: changed.proposalFingerprint,
        repositoryFingerprint: changed.repositoryFingerprint
      },
      adapter
    );
    if (!rendered.ok) throw new Error(rendered.error.message);
    const content = rendered.value.changes.find((item) => item.path === "AGENTS.md")?.content;
    expect(content?.startsWith("\ufeff")).toBe(false);
    expect(content).not.toContain("\r\n");
    expect(content?.endsWith("\n")).toBe(false);
    expect(content).toContain("Keep me.");
    await repository.cleanup();
  });

  it("reports partial failure and refuses to complete it with the old approval", async () => {
    const { repository, proposal } = await plan();
    const extra = {
      ...proposal.plannedChanges[0]!,
      path: ".agents/skills/project-architect/SKILL.md"
    };
    const last = { ...proposal.plannedChanges[0]!, path: "README.md" };
    const changed = {
      ...proposal,
      plannedChanges: [...proposal.plannedChanges, extra, last],
      proposalFingerprint: "pending"
    };
    changed.proposalFingerprint = computeProposalFingerprint(changed);
    const rendered = await renderProposal(
      repository.root,
      changed,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: changed.revision,
        proposalFingerprint: changed.proposalFingerprint,
        repositoryFingerprint: changed.repositoryFingerprint
      },
      adapter
    );
    if (!rendered.ok) throw new Error(rendered.error.message);
    const approval = {
      stage: "write" as const,
      confirmed: true as const,
      proposalRevision: rendered.value.revision,
      renderedFingerprint: rendered.value.renderedFingerprint,
      repositoryFingerprint: rendered.value.repositoryFingerprint
    };
    let writes = 0;
    const partial = await applyRenderedProposal(repository.root, rendered.value, approval, {
      writerHooks: {
        beforeRename: async () => {
          writes += 1;
          if (writes === 2) throw new Error("lost write");
        }
      }
    });
    expect(partial).toMatchObject({
      ok: true,
      value: {
        outcome: "failed",
        changedPaths: [".agents/skills/project-architect/SKILL.md"],
        appliedChanges: [
          { path: ".agents/skills/project-architect/SKILL.md", outcome: "created" },
          { path: "AGENTS.md", outcome: "failed" },
          { path: "README.md", outcome: "not-attempted" }
        ]
      }
    });
    const retry = await applyRenderedProposal(repository.root, rendered.value, approval);
    expect(retry).toMatchObject({ ok: false, error: { code: "STALE_PROPOSAL" } });
    await repository.cleanup();
  });

  it("reports every preflight conflict and marks writable targets not attempted", async () => {
    const { repository, proposal } = await plan();
    const changed = {
      ...proposal,
      plannedChanges: [
        ...proposal.plannedChanges,
        { ...proposal.plannedChanges[0]!, path: "one.txt", action: "conflict" as const },
        { ...proposal.plannedChanges[0]!, path: "two.txt", action: "conflict" as const }
      ],
      proposalFingerprint: "pending"
    };
    changed.proposalFingerprint = computeProposalFingerprint(changed);
    const rendered = await renderProposal(
      repository.root,
      changed,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: changed.revision,
        proposalFingerprint: changed.proposalFingerprint,
        repositoryFingerprint: changed.repositoryFingerprint
      },
      adapter
    );
    if (!rendered.ok) throw new Error(rendered.error.message);
    const result = await applyRenderedProposal(repository.root, rendered.value, {
      stage: "write",
      confirmed: true,
      proposalRevision: rendered.value.revision,
      renderedFingerprint: rendered.value.renderedFingerprint,
      repositoryFingerprint: rendered.value.repositoryFingerprint
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        outcome: "failed",
        changedPaths: [],
        failures: [{ path: "one.txt" }, { path: "two.txt" }],
        appliedChanges: [
          { path: "AGENTS.md", outcome: "not-attempted" },
          { path: "one.txt", outcome: "conflict" },
          { path: "two.txt", outcome: "conflict" }
        ]
      }
    });
    await repository.cleanup();
  });

  it("allows first managed creation and rejects a malformed existing receipt", async () => {
    const first = await plan();
    const managedProposal = {
      ...first.proposal,
      plannedChanges: first.proposal.plannedChanges.map((item) => ({
        ...item,
        ownership: "devcharter-managed" as const
      })),
      proposalFingerprint: "pending"
    };
    managedProposal.proposalFingerprint = computeProposalFingerprint(managedProposal);
    const rendered = await renderProposal(
      first.repository.root,
      managedProposal,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: managedProposal.revision,
        proposalFingerprint: managedProposal.proposalFingerprint,
        repositoryFingerprint: managedProposal.repositoryFingerprint
      },
      adapter
    );
    expect(rendered).toMatchObject({ ok: true, value: { changes: [{ managedState: "new" }] } });
    if (!rendered.ok) throw new Error(rendered.error.message);
    const applied = await applyRenderedProposal(first.repository.root, rendered.value, {
      stage: "write",
      confirmed: true,
      proposalRevision: rendered.value.revision,
      renderedFingerprint: rendered.value.renderedFingerprint,
      repositoryFingerprint: rendered.value.repositoryFingerprint
    });
    expect(applied).toMatchObject({
      ok: true,
      value: {
        outcome: "applied",
        changedPaths: ["AGENTS.md", ".devcharter/managed-files.json"],
        appliedChanges: [
          { path: "AGENTS.md", outcome: "created" },
          { path: ".devcharter/managed-files.json", outcome: "created" }
        ]
      }
    });
    await first.repository.cleanup();

    const malformed = await plan({ ".devcharter/managed-files.json": "not json" });
    const proposal = {
      ...malformed.proposal,
      plannedChanges: malformed.proposal.plannedChanges.map((item) => ({
        ...item,
        ownership: "devcharter-managed" as const
      })),
      proposalFingerprint: "pending"
    };
    proposal.proposalFingerprint = computeProposalFingerprint(proposal);
    const conflict = await renderProposal(
      malformed.repository.root,
      proposal,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      },
      adapter
    );
    expect(conflict).toMatchObject({ ok: true, value: { changes: [{ action: "conflict" }] } });
    await malformed.repository.cleanup();
  });

  it.each([
    {
      location: "root",
      receipt: {
        version: 1,
        files: [],
        secret: "must-not-survive"
      }
    },
    {
      location: "entry",
      receipt: {
        version: 1,
        files: [
          {
            path: "old.md",
            adapter: "codex",
            baselineHash: "a".repeat(64),
            managed: true,
            secret: "must-not-survive"
          }
        ]
      }
    }
  ])(
    "rejects undeclared managed receipt $location fields instead of carrying sensitive data forward",
    async ({ receipt }) => {
      const existingReceipt = JSON.stringify(receipt, null, 2) + "\n";
      const { repository, rendered } = await renderManagedPlan({
        ".devcharter/managed-files.json": existingReceipt
      });

      expect(rendered).toMatchObject({
        changes: [{ action: "conflict", conflictDetail: expect.stringContaining("malformed") }]
      });
      expect(rendered.receiptContent).toBeUndefined();
      expect(await readFile(`${repository.root}/.devcharter/managed-files.json`, "utf8")).toBe(
        existingReceipt
      );
      await repository.cleanup();
    }
  );

  it("rejects valid managed receipt drift before writing any target", async () => {
    const originalReceipt =
      JSON.stringify(
        {
          version: 1,
          files: [
            {
              path: "old.md",
              adapter: "codex",
              baselineHash: "a".repeat(64),
              managed: true
            }
          ]
        },
        null,
        2
      ) + "\n";
    const { repository, proposal } = await plan({
      ".devcharter/managed-files.json": originalReceipt
    });
    const managedProposal = {
      ...proposal,
      plannedChanges: proposal.plannedChanges.map((item) => ({
        ...item,
        ownership: "devcharter-managed" as const
      })),
      proposalFingerprint: "pending"
    };
    managedProposal.proposalFingerprint = computeProposalFingerprint(managedProposal);
    const rendered = await renderProposal(
      repository.root,
      managedProposal,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: managedProposal.revision,
        proposalFingerprint: managedProposal.proposalFingerprint,
        repositoryFingerprint: managedProposal.repositoryFingerprint
      },
      adapter
    );
    if (!rendered.ok) throw new Error(rendered.error.message);
    expect(rendered.value).toMatchObject({
      receiptExpected: "present",
      receiptBaselineHash: expect.stringMatching(/^[a-f0-9]{64}$/)
    });

    const changedReceipt =
      JSON.stringify(
        {
          version: 1,
          files: [
            ...JSON.parse(originalReceipt).files,
            {
              path: "concurrent.md",
              adapter: "codex",
              baselineHash: "b".repeat(64),
              managed: true
            }
          ]
        },
        null,
        2
      ) + "\n";
    await repository.write(".devcharter/managed-files.json", changedReceipt);

    const result = await applyRenderedProposal(repository.root, rendered.value, {
      stage: "write",
      confirmed: true,
      proposalRevision: rendered.value.revision,
      renderedFingerprint: rendered.value.renderedFingerprint,
      repositoryFingerprint: rendered.value.repositoryFingerprint
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        outcome: "failed",
        changedPaths: [],
        appliedChanges: [
          { path: "AGENTS.md", outcome: "not-attempted" },
          { path: ".devcharter/managed-files.json", outcome: "failed" }
        ],
        failures: [{ code: "STALE_PROPOSAL", path: ".devcharter/managed-files.json" }]
      }
    });
    expect(await readFile(`${repository.root}/.devcharter/managed-files.json`, "utf8")).toBe(
      changedReceipt
    );
    expect(await repository.snapshot()).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "AGENTS.md" })])
    );
    await repository.cleanup();
  });

  it.each([
    {
      name: "appears after rendering",
      initialFiles: {} as Record<string, string>,
      expected: "absent" as const,
      mutate: async (root: string) => {
        const receipt = JSON.stringify({ version: 1, files: [] }, null, 2) + "\n";
        await mkdir(`${root}/.devcharter`, { recursive: true });
        await writeFile(`${root}/.devcharter/managed-files.json`, receipt, "utf8");
      }
    },
    {
      name: "disappears after rendering",
      initialFiles: {
        ".devcharter/managed-files.json": JSON.stringify({ version: 1, files: [] }, null, 2) + "\n"
      } as Record<string, string>,
      expected: "present" as const,
      mutate: async (root: string) => unlink(`${root}/.devcharter/managed-files.json`)
    }
  ])("rejects a managed receipt that $name before any target write", async (scenario) => {
    const { repository, rendered } = await renderManagedPlan(scenario.initialFiles);
    expect(rendered.receiptExpected).toBe(scenario.expected);
    await scenario.mutate(repository.root);

    const result = await applyRenderedProposal(repository.root, rendered, {
      stage: "write",
      confirmed: true,
      proposalRevision: rendered.revision,
      renderedFingerprint: rendered.renderedFingerprint,
      repositoryFingerprint: rendered.repositoryFingerprint
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        outcome: "failed",
        changedPaths: [],
        appliedChanges: [
          { path: "AGENTS.md", outcome: "not-attempted" },
          { path: ".devcharter/managed-files.json", outcome: "failed" }
        ],
        failures: [{ code: "STALE_PROPOSAL", path: ".devcharter/managed-files.json" }]
      }
    });
    expect(await repository.snapshot()).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "AGENTS.md" })])
    );
    await repository.cleanup();
  });

  it("rejects duplicate managed receipt paths without rewriting the receipt", async () => {
    const existingReceipt =
      JSON.stringify(
        {
          version: 1,
          files: [
            {
              path: "old.md",
              adapter: "codex",
              baselineHash: "a".repeat(64),
              managed: true
            },
            {
              path: "old.md",
              adapter: "codex",
              baselineHash: "b".repeat(64),
              managed: true
            }
          ]
        },
        null,
        2
      ) + "\n";
    const { repository, rendered } = await renderManagedPlan({
      ".devcharter/managed-files.json": existingReceipt
    });

    expect(rendered).toMatchObject({
      changes: [{ action: "conflict", conflictDetail: expect.stringContaining("malformed") }]
    });
    expect(rendered.receiptContent).toBeUndefined();
    expect(await readFile(`${repository.root}/.devcharter/managed-files.json`, "utf8")).toBe(
      existingReceipt
    );
    await repository.cleanup();
  });

  it("rejects the managed receipt path as an ordinary proposal target", async () => {
    const { repository, proposal } = await plan();
    const invalidProposal = {
      ...proposal,
      plannedChanges: proposal.plannedChanges.map((change) => ({
        ...change,
        path: ".devcharter/managed-files.json"
      })),
      proposalFingerprint: "pending"
    };
    invalidProposal.proposalFingerprint = computeProposalFingerprint(invalidProposal);

    const rendered = await renderProposal(
      repository.root,
      invalidProposal,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: invalidProposal.revision,
        proposalFingerprint: invalidProposal.proposalFingerprint,
        repositoryFingerprint: invalidProposal.repositoryFingerprint
      },
      adapter
    );

    expect(rendered).toMatchObject({
      ok: false,
      error: { code: "INVALID_ARGUMENT", path: ".devcharter/managed-files.json" }
    });
    await repository.cleanup();
  });

  it("preserves target content changed after application preflight", async () => {
    const existingContent = "# Existing\n\nProject-owned content.\n";
    const concurrentContent = "# Concurrent user change\n";
    const { repository, proposal } = await plan({ "AGENTS.md": existingContent });
    const updateProposal = {
      ...proposal,
      plannedChanges: proposal.plannedChanges.map((change) => ({
        ...change,
        action: "update" as const,
        content: undefined
      })),
      proposalFingerprint: "pending"
    };
    updateProposal.proposalFingerprint = computeProposalFingerprint(updateProposal);
    const rendered = await renderProposal(
      repository.root,
      updateProposal,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: updateProposal.revision,
        proposalFingerprint: updateProposal.proposalFingerprint,
        repositoryFingerprint: updateProposal.repositoryFingerprint
      },
      adapter
    );
    if (!rendered.ok) throw new Error(rendered.error.message);

    const result = await applyRenderedProposal(
      repository.root,
      rendered.value,
      {
        stage: "write",
        confirmed: true,
        proposalRevision: rendered.value.revision,
        renderedFingerprint: rendered.value.renderedFingerprint,
        repositoryFingerprint: rendered.value.repositoryFingerprint
      },
      {
        writerHooks: {
          beforeRename: async () =>
            writeFile(`${repository.root}/AGENTS.md`, concurrentContent, "utf8")
        }
      }
    );

    expect(result).toMatchObject({
      ok: true,
      value: {
        outcome: "failed",
        changedPaths: [],
        appliedChanges: [{ path: "AGENTS.md", outcome: "failed" }],
        failures: [{ code: "STALE_PROPOSAL", path: "AGENTS.md" }]
      }
    });
    expect(await readFile(`${repository.root}/AGENTS.md`, "utf8")).toBe(concurrentContent);
    await repository.cleanup();
  });

  it("preserves a managed receipt created after preflight and reports partial application", async () => {
    const concurrentReceipt = JSON.stringify({ version: 1, files: [] }, null, 2) + "\n";
    const { repository, rendered } = await renderManagedPlan();
    let writes = 0;

    const result = await applyRenderedProposal(
      repository.root,
      rendered,
      {
        stage: "write",
        confirmed: true,
        proposalRevision: rendered.revision,
        renderedFingerprint: rendered.renderedFingerprint,
        repositoryFingerprint: rendered.repositoryFingerprint
      },
      {
        writerHooks: {
          beforeRename: async () => {
            writes += 1;
            if (writes === 2) {
              await mkdir(`${repository.root}/.devcharter`, { recursive: true });
              await writeFile(
                `${repository.root}/.devcharter/managed-files.json`,
                concurrentReceipt,
                "utf8"
              );
            }
          }
        }
      }
    );

    expect(result).toMatchObject({
      ok: true,
      value: {
        outcome: "failed",
        changedPaths: ["AGENTS.md"],
        appliedChanges: [
          { path: "AGENTS.md", outcome: "created" },
          { path: ".devcharter/managed-files.json", outcome: "failed" }
        ],
        failures: [{ code: "STALE_PROPOSAL", path: ".devcharter/managed-files.json" }]
      }
    });
    expect(await readFile(`${repository.root}/.devcharter/managed-files.json`, "utf8")).toBe(
      concurrentReceipt
    );
    await repository.cleanup();
  });

  it("requires an explicit project-owned adoption baseline and rejects missing prior receipt data", async () => {
    const existingContent = "# Existing\n\nProject-owned content.\n";
    const adoption = await plan({ "AGENTS.md": existingContent });
    const adoptionProposal = {
      ...adoption.proposal,
      plannedChanges: adoption.proposal.plannedChanges.map((item) =>
        item.path === "AGENTS.md"
          ? {
              ...item,
              action: "update" as const,
              origin: "project" as const,
              ownership: "devcharter-managed" as const,
              content: undefined
            }
          : item
      ),
      proposalFingerprint: "pending"
    };
    adoptionProposal.proposalFingerprint = computeProposalFingerprint(adoptionProposal);
    const adopted = await renderProposal(
      adoption.repository.root,
      adoptionProposal,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: adoptionProposal.revision,
        proposalFingerprint: adoptionProposal.proposalFingerprint,
        repositoryFingerprint: adoptionProposal.repositoryFingerprint
      },
      adapter
    );
    expect(adopted).toMatchObject({
      ok: true,
      value: {
        changes: [
          {
            path: "AGENTS.md",
            action: "update",
            managedState: "adopt",
            baselineHash: expect.stringMatching(/^[a-f0-9]{64}$/)
          }
        ]
      }
    });
    await adoption.repository.cleanup();

    const missingReceipt = await plan({ "AGENTS.md": existingContent });
    const alreadyManagedProposal = {
      ...missingReceipt.proposal,
      plannedChanges: missingReceipt.proposal.plannedChanges.map((item) =>
        item.path === "AGENTS.md"
          ? {
              ...item,
              action: "update" as const,
              origin: "devcharter" as const,
              ownership: "devcharter-managed" as const,
              content: undefined
            }
          : item
      ),
      proposalFingerprint: "pending"
    };
    alreadyManagedProposal.proposalFingerprint = computeProposalFingerprint(alreadyManagedProposal);
    const conflict = await renderProposal(
      missingReceipt.repository.root,
      alreadyManagedProposal,
      {
        stage: "abstract",
        confirmed: true,
        proposalRevision: alreadyManagedProposal.revision,
        proposalFingerprint: alreadyManagedProposal.proposalFingerprint,
        repositoryFingerprint: alreadyManagedProposal.repositoryFingerprint
      },
      adapter
    );
    expect(conflict).toMatchObject({
      ok: true,
      value: { changes: [{ path: "AGENTS.md", action: "conflict" }] }
    });
    await missingReceipt.repository.cleanup();
  });
});
