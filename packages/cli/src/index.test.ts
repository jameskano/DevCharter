import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  computeProposalFingerprint,
  runProjectArchitect
} from "@devcharter/core/project-architect";
import { afterEach, describe, expect, it } from "vitest";

import { DEVCHARTER_VERSION, runCli, type CliIo } from "./index.js";
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

function captureIo(cwd: string): { io: CliIo; stdout: string[]; stderr: string[] } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    io: {
      cwd,
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value)
    },
    stdout,
    stderr
  };
}

describe("exact CLI surface", () => {
  it("supports help and version output", async () => {
    const repository = await temporaryRepository();
    const help = captureIo(repository.root);
    await expect(runCli(["--help"], help.io)).resolves.toBe(0);
    expect(help.stdout.join("")).toContain("devcharter inspect");
    expect(help.stdout.join("")).toContain("devcharter validate");
    expect(help.stdout.join("")).toContain("devcharter new");
    expect(help.stdout.join("")).toContain("devcharter retrofit");
    expect(help.stdout.join("")).toContain("devcharter audit");
    expect(help.stdout.join("")).toContain("devcharter render");
    expect(help.stdout.join("")).toContain("devcharter apply");

    const version = captureIo(repository.root);
    await expect(runCli(["--version"], version.io)).resolves.toBe(0);
    expect(version.stdout.join("")).toBe("devcharter " + DEVCHARTER_VERSION + "\n");
  });

  it.each(["check", "session", "generate", "migrate"])(
    "rejects the deferred or obsolete %s command",
    async (command) => {
      const repository = await temporaryRepository();
      const output = captureIo(repository.root);
      await expect(runCli([command], output.io)).resolves.toBe(2);
      expect(output.stderr.join("")).toContain("Unknown command");
    }
  );

  it("feeds canonical decisions and a current previous proposal back into new", async () => {
    const repository = await temporaryRepository();
    const inputs = await temporaryRepository();
    await inputs.write(
      "decisions.json",
      JSON.stringify([
        { id: "project.outcome", value: "A qualified local package" },
        { id: "project.aiTools", value: ["Codex"] }
      ])
    );
    const first = captureIo(repository.root);
    await expect(
      runCli(
        [
          "new",
          "--scope",
          "ai",
          "--decisions",
          `${inputs.root}/decisions.json`,
          "--format",
          "json"
        ],
        first.io
      )
    ).resolves.toBe(0);
    const firstEnvelope = JSON.parse(first.stdout.join("")) as {
      result: { proposal: { revision: number } };
    };
    expect(firstEnvelope.result.proposal.revision).toBe(1);
    await inputs.write("previous.json", first.stdout.join(""));

    const second = captureIo(repository.root);
    await expect(
      runCli(
        [
          "new",
          "--scope",
          "ai",
          "--decisions",
          `${inputs.root}/decisions.json`,
          "--previous-proposal",
          `${inputs.root}/previous.json`,
          "--format",
          "json"
        ],
        second.io
      )
    ).resolves.toBe(0);
    expect(JSON.parse(second.stdout.join(""))).toMatchObject({
      ok: true,
      result: { proposal: { revision: 1 } }
    });

    await repository.write("AGENTS.md", "# Changed after the proposal\n");
    const stale = captureIo(repository.root);
    await expect(
      runCli(
        [
          "new",
          "--scope",
          "ai",
          "--decisions",
          `${inputs.root}/decisions.json`,
          "--previous-proposal",
          `${inputs.root}/previous.json`,
          "--format",
          "json"
        ],
        stale.io
      )
    ).resolves.toBe(1);
    expect(JSON.parse(stale.stdout.join(""))).toMatchObject({
      ok: false,
      errors: [{ code: "STALE_PROPOSAL" }]
    });
  });

  it("rejects malformed, duplicate, inapplicable, and audit decision inputs structurally", async () => {
    const repository = await temporaryRepository();
    await repository.write("malformed.json", "not-json");
    await repository.write(
      "duplicate.json",
      JSON.stringify([
        { id: "project.outcome", value: "one" },
        { id: "project.outcome", value: "two" }
      ])
    );
    await repository.write(
      "inapplicable.json",
      JSON.stringify([{ id: "project.technologies", value: ["TypeScript"] }])
    );
    await repository.write(
      "conflicting.json",
      JSON.stringify([
        { id: "project.outcome", value: "Ship safely" },
        { id: "project.mode", value: "retrofit" }
      ])
    );

    for (const [name, scope, code] of [
      ["malformed.json", "full", "INVALID_ARGUMENT"],
      ["duplicate.json", "full", "INVALID_ARGUMENT"],
      ["inapplicable.json", "ai", "INVALID_ARGUMENT"],
      ["conflicting.json", "full", "INVALID_ARGUMENT"]
    ] as const) {
      const output = captureIo(repository.root);
      await runCli(
        ["new", "--scope", scope, "--decisions", `${repository.root}/${name}`, "--format", "json"],
        output.io
      );
      expect(JSON.parse(output.stdout.join(""))).toMatchObject({ ok: false, errors: [{ code }] });
    }

    const audit = captureIo(repository.root);
    await expect(
      runCli(["audit", "--decisions", `${repository.root}/duplicate.json`], audit.io)
    ).resolves.toBe(2);
    expect(audit.stderr.join("")).toContain("supported only by new and retrofit");
  });

  it("composes successful new and render JSON envelopes through both approval gates", async () => {
    const target = await temporaryRepository();
    const inputs = await temporaryRepository();
    await inputs.write(
      "decisions.json",
      JSON.stringify([
        { id: "project.outcome", value: "A composable CLI repository" },
        { id: "project.aiTools", value: ["Codex"] }
      ])
    );
    const proposed = captureIo(target.root);
    await runCli(
      ["new", "--scope", "ai", "--decisions", `${inputs.root}/decisions.json`, "--format", "json"],
      proposed.io
    );
    const proposalEnvelope = JSON.parse(proposed.stdout.join("")) as {
      result: {
        proposal: { revision: number; proposalFingerprint: string; repositoryFingerprint: string };
      };
    };
    await inputs.write("proposal-envelope.json", proposed.stdout.join(""));
    await inputs.write(
      "abstract.json",
      JSON.stringify({
        stage: "abstract",
        confirmed: true,
        proposalRevision: proposalEnvelope.result.proposal.revision,
        proposalFingerprint: proposalEnvelope.result.proposal.proposalFingerprint,
        repositoryFingerprint: proposalEnvelope.result.proposal.repositoryFingerprint
      })
    );
    for (const [name, input] of [
      ["missing-proposal.json", { ok: true, command: "new", result: {} }],
      ["unsuccessful-proposal.json", { ...proposalEnvelope, ok: false }],
      [
        "ambiguous-proposal.json",
        { ...proposalEnvelope, proposal: proposalEnvelope.result.proposal }
      ],
      ["invalid-proposal.json", { ok: true, command: "new", result: { proposal: {} } }]
    ] as const) {
      await inputs.write(name, JSON.stringify(input));
      const rejected = captureIo(target.root);
      await expect(
        runCli(
          [
            "render",
            "--proposal",
            `${inputs.root}/${name}`,
            "--approval",
            `${inputs.root}/abstract.json`,
            "--adapter",
            "codex",
            "--format",
            "json"
          ],
          rejected.io
        )
      ).resolves.toBe(2);
      expect(JSON.parse(rejected.stdout.join(""))).toMatchObject({
        ok: false,
        errors: [{ code: "INVALID_ARGUMENT" }]
      });
    }
    const rendered = captureIo(target.root);
    await expect(
      runCli(
        [
          "render",
          "--proposal",
          `${inputs.root}/proposal-envelope.json`,
          "--approval",
          `${inputs.root}/abstract.json`,
          "--adapter",
          "codex",
          "--format",
          "json"
        ],
        rendered.io
      )
    ).resolves.toBe(0);
    const renderEnvelope = JSON.parse(rendered.stdout.join("")) as {
      result: { revision: number; renderedFingerprint: string; repositoryFingerprint: string };
    };
    await inputs.write("render-envelope.json", rendered.stdout.join(""));
    await inputs.write(
      "write.json",
      JSON.stringify({
        stage: "write",
        confirmed: true,
        proposalRevision: renderEnvelope.result.revision,
        renderedFingerprint: renderEnvelope.result.renderedFingerprint,
        repositoryFingerprint: renderEnvelope.result.repositoryFingerprint
      })
    );
    for (const [name, input] of [
      ["missing-plan.json", { ok: true, command: "render", result: {} }],
      ["unsuccessful-plan.json", { ...renderEnvelope, ok: false }],
      ["ambiguous-plan.json", { ...renderEnvelope, plan: renderEnvelope.result }],
      ["invalid-plan.json", { ok: true, command: "render", result: { plan: {} } }]
    ] as const) {
      await inputs.write(name, JSON.stringify(input));
      const rejected = captureIo(target.root);
      await expect(
        runCli(
          [
            "apply",
            "--plan",
            `${inputs.root}/${name}`,
            "--approval",
            `${inputs.root}/write.json`,
            "--format",
            "json"
          ],
          rejected.io
        )
      ).resolves.toBe(2);
      expect(JSON.parse(rejected.stdout.join(""))).toMatchObject({
        ok: false,
        errors: [{ code: "INVALID_ARGUMENT" }]
      });
    }
    const applied = captureIo(target.root);
    await expect(
      runCli(
        [
          "apply",
          "--plan",
          `${inputs.root}/render-envelope.json`,
          "--approval",
          `${inputs.root}/write.json`,
          "--format",
          "json"
        ],
        applied.io
      )
    ).resolves.toBe(0);
    expect(JSON.parse(applied.stdout.join(""))).toMatchObject({
      ok: true,
      result: { outcome: "applied", changedPaths: ["AGENTS.md"] }
    });
  });

  it("renders and applies through separate lifecycle commands", async () => {
    const target = await temporaryRepository();
    const inputs = await temporaryRepository();
    const analysis = await runProjectArchitect(target.root, {
      mode: "new",
      scope: "ai",
      acceptedDecisions: [
        { id: "project.outcome", value: "A tested repository" },
        { id: "project.aiTools", value: ["Codex"] }
      ]
    });
    if (!analysis.ok || analysis.value.proposal === undefined) throw new Error("proposal failed");
    const proposal = analysis.value.proposal;
    await inputs.write("proposal.json", JSON.stringify(proposal));
    await inputs.write(
      "abstract-approval.json",
      JSON.stringify({
        stage: "abstract",
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      })
    );
    const humanRendered = captureIo(target.root);
    await expect(
      runCli(
        [
          "render",
          "--proposal",
          `${inputs.root}/proposal.json`,
          "--approval",
          `${inputs.root}/abstract-approval.json`,
          "--adapter",
          "codex"
        ],
        humanRendered.io
      )
    ).resolves.toBe(0);
    expect(humanRendered.stdout.join("").replace(/[a-f0-9]{64}/g, "<hash>")).toMatchInlineSnapshot(`
      "DevCharter render
      Rendered fingerprint: <hash>
      Targets:
      - create AGENTS.md
        Purpose: Provide concise native repository instructions for selected AI coding tools
        Reason: No root AI instruction file exists and the selected scope includes AI
        Origin: devcharter
        Ownership: project
        Adapter: codex
        Expected state: absent
        Baseline hash: none
        Content hash: <hash>
        Validation expectations:
          - Referenced paths and commands resolve
          - The file remains project-owned
        Proposed content JSON: "# Repository instructions\\n\\n## Purpose\\n\\nA tested repository\\n\\n## Workflow\\n\\nInspect before changing files, preserve project-owned content, and run the repository's authoritative verification commands.\\n"
      Review this complete plan and provide a write-stage approval before apply.
      "
    `);
    const renderedOutput = captureIo(target.root);
    await expect(
      runCli(
        [
          "render",
          "--proposal",
          `${inputs.root}/proposal.json`,
          "--approval",
          `${inputs.root}/abstract-approval.json`,
          "--adapter",
          "codex",
          "--format",
          "json"
        ],
        renderedOutput.io
      )
    ).resolves.toBe(0);
    const renderedEnvelope = JSON.parse(renderedOutput.stdout.join("")) as {
      result: { revision: number; renderedFingerprint: string; repositoryFingerprint: string };
    };
    await inputs.write("plan.json", JSON.stringify(renderedEnvelope.result));
    await inputs.write(
      "write-approval.json",
      JSON.stringify({
        stage: "write",
        confirmed: true,
        proposalRevision: renderedEnvelope.result.revision,
        renderedFingerprint: renderedEnvelope.result.renderedFingerprint,
        repositoryFingerprint: renderedEnvelope.result.repositoryFingerprint
      })
    );
    const appliedOutput = captureIo(target.root);
    await expect(
      runCli(
        [
          "apply",
          "--plan",
          `${inputs.root}/plan.json`,
          "--approval",
          `${inputs.root}/write-approval.json`,
          "--format",
          "json"
        ],
        appliedOutput.io
      )
    ).resolves.toBe(0);
    expect(JSON.parse(appliedOutput.stdout.join(""))).toMatchObject({
      command: "apply",
      ok: true,
      result: { outcome: "applied", changedPaths: ["AGENTS.md"] }
    });
    const humanRetry = captureIo(target.root);
    await expect(
      runCli(
        [
          "apply",
          "--plan",
          `${inputs.root}/plan.json`,
          "--approval",
          `${inputs.root}/write-approval.json`
        ],
        humanRetry.io
      )
    ).resolves.toBe(0);
    expect(humanRetry.stdout.join("")).toMatchInlineSnapshot(`
      "DevCharter apply
      Outcome: already-applied
      Target outcomes:
      - skipped AGENTS.md: Already matches the rendered plan
      Changed paths:
      - none
      Validation:
      - All rendered targets and managed metadata already match
      "
    `);
  });

  it("includes complete managed receipt review material in human render output", async () => {
    const target = await temporaryRepository();
    const inputs = await temporaryRepository();
    const analysis = await runProjectArchitect(target.root, {
      mode: "new",
      scope: "ai",
      acceptedDecisions: [
        { id: "project.outcome", value: "A managed test repository" },
        { id: "project.aiTools", value: ["Codex"] }
      ]
    });
    if (!analysis.ok || analysis.value.proposal === undefined) throw new Error("proposal failed");
    const proposal = {
      ...analysis.value.proposal,
      plannedChanges: analysis.value.proposal.plannedChanges.map((change) => ({
        ...change,
        ownership: "devcharter-managed" as const
      })),
      proposalFingerprint: "pending"
    };
    proposal.proposalFingerprint = computeProposalFingerprint(proposal);
    await inputs.write("proposal.json", JSON.stringify(proposal));
    await inputs.write(
      "approval.json",
      JSON.stringify({
        stage: "abstract",
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      })
    );

    const output = captureIo(target.root);
    await expect(
      runCli(
        [
          "render",
          "--proposal",
          `${inputs.root}/proposal.json`,
          "--approval",
          `${inputs.root}/approval.json`,
          "--adapter",
          "codex"
        ],
        output.io
      )
    ).resolves.toBe(0);

    const human = output.stdout.join("");
    expect(human).toContain("Managed receipt:\n- .devcharter/managed-files.json");
    expect(human).toContain("Expected state: absent");
    expect(human).toContain("Baseline hash: none");
    expect(human).toContain('Proposed content JSON: "{\\n  \\"version\\"');
    expect(human).toContain('\\"path\\": \\"AGENTS.md\\"');
  });

  it("renders an approved engineering package.json without guessing commands", async () => {
    const target = await temporaryRepository();
    const inputs = await temporaryRepository();
    const analysis = await runProjectArchitect(target.root, {
      mode: "new",
      scope: "engineering",
      acceptedDecisions: [
        { id: "project.outcome", value: "A tested TypeScript package" },
        { id: "project.technologies", value: ["TypeScript", "Node.js"] },
        {
          id: "project.packageScripts",
          value: { typecheck: "tsc --noEmit", test: "vitest run" }
        }
      ]
    });
    if (!analysis.ok || analysis.value.proposal === undefined) throw new Error("proposal failed");
    const proposal = analysis.value.proposal;
    expect(proposal.questions).toEqual([]);
    await inputs.write("proposal.json", JSON.stringify(proposal));
    await inputs.write(
      "approval.json",
      JSON.stringify({
        stage: "abstract",
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      })
    );
    const output = captureIo(target.root);
    await expect(
      runCli(
        [
          "render",
          "--proposal",
          `${inputs.root}/proposal.json`,
          "--approval",
          `${inputs.root}/approval.json`,
          "--adapter",
          "codex",
          "--format",
          "json"
        ],
        output.io
      )
    ).resolves.toBe(0);
    const envelope = JSON.parse(output.stdout.join("")) as {
      result: { changes: Array<{ path: string; action: string; content?: string }> };
    };
    expect(envelope.result.changes).toContainEqual(
      expect.objectContaining({
        path: "package.json",
        action: "create",
        content:
          '{\n  "scripts": {\n    "test": "vitest run",\n    "typecheck": "tsc --noEmit"\n  }\n}\n'
      })
    );
  });

  it("reports conflicts, failures, and unattempted targets in human apply output", async () => {
    const target = await temporaryRepository();
    const inputs = await temporaryRepository();
    const analysis = await runProjectArchitect(target.root, {
      mode: "new",
      scope: "ai",
      acceptedDecisions: [
        { id: "project.outcome", value: "A tested repository" },
        { id: "project.aiTools", value: ["Codex"] }
      ]
    });
    if (!analysis.ok || analysis.value.proposal === undefined) throw new Error("proposal failed");
    const proposal = {
      ...analysis.value.proposal,
      plannedChanges: [
        ...analysis.value.proposal.plannedChanges,
        {
          ...analysis.value.proposal.plannedChanges[0]!,
          path: "blocked.md",
          action: "conflict" as const,
          reason: "An ownership decision is required"
        }
      ],
      proposalFingerprint: "pending"
    };
    proposal.proposalFingerprint = computeProposalFingerprint(proposal);
    await inputs.write("proposal.json", JSON.stringify(proposal));
    await inputs.write(
      "abstract.json",
      JSON.stringify({
        stage: "abstract",
        confirmed: true,
        proposalRevision: proposal.revision,
        proposalFingerprint: proposal.proposalFingerprint,
        repositoryFingerprint: proposal.repositoryFingerprint
      })
    );
    const rendered = captureIo(target.root);
    await runCli(
      [
        "render",
        "--proposal",
        `${inputs.root}/proposal.json`,
        "--approval",
        `${inputs.root}/abstract.json`,
        "--adapter",
        "codex",
        "--format",
        "json"
      ],
      rendered.io
    );
    const plan = JSON.parse(rendered.stdout.join("")) as {
      result: { revision: number; renderedFingerprint: string; repositoryFingerprint: string };
    };
    await inputs.write("plan.json", JSON.stringify(plan.result));
    await inputs.write(
      "write.json",
      JSON.stringify({
        stage: "write",
        confirmed: true,
        proposalRevision: plan.result.revision,
        renderedFingerprint: plan.result.renderedFingerprint,
        repositoryFingerprint: plan.result.repositoryFingerprint
      })
    );
    const output = captureIo(target.root);
    await expect(
      runCli(
        ["apply", "--plan", `${inputs.root}/plan.json`, "--approval", `${inputs.root}/write.json`],
        output.io
      )
    ).resolves.toBe(1);
    expect(output.stdout.join("")).toMatchInlineSnapshot(`
      "DevCharter apply
      Outcome: failed
      Target outcomes:
      - not-attempted AGENTS.md
      - conflict blocked.md: Rendered target has an unresolved conflict
      Changed paths:
      - none
      Validation:
      - Preflight failed before the first write
      Failures:
      - INVALID_ARGUMENT blocked.md: Rendered target has an unresolved conflict
      "
    `);
  });

  it("rejects positional repository arguments and unsupported formats", async () => {
    const repository = await temporaryRepository();
    const positional = captureIo(repository.root);
    await expect(runCli(["inspect", "../other"], positional.io)).resolves.toBe(2);
    expect(positional.stderr.join("")).toContain("Positional repository arguments");

    const format = captureIo(repository.root);
    await expect(runCli(["validate", "--format", "xml"], format.io)).resolves.toBe(2);
    expect(format.stderr.join("")).toContain("--format must be human or json");

    const scope = captureIo(repository.root);
    await expect(runCli(["audit", "--scope", "architecture"], scope.io)).resolves.toBe(2);
    expect(scope.stderr.join("")).toContain("--scope must be full");

    const inspectScope = captureIo(repository.root);
    await expect(runCli(["inspect", "--scope", "ai"], inspectScope.io)).resolves.toBe(2);
    expect(inspectScope.stderr.join("")).toContain("--scope is supported only");
  });

  it.each(["full", "governance", "engineering", "ai"] as const)(
    "supports all four scopes and defaults to full: %s",
    async (scope) => {
      const repository = await temporaryRepository({ "README.md": "# Project" });
      const scoped = captureIo(repository.root);
      await expect(
        runCli(["audit", "--scope", scope, "--format", "json"], scoped.io)
      ).resolves.toBe(0);
      expect(JSON.parse(scoped.stdout.join(""))).toMatchObject({
        command: "audit",
        result: { scope }
      });

      const defaulted = captureIo(repository.root);
      await expect(runCli(["audit", "--format", "json"], defaulted.io)).resolves.toBe(0);
      expect(JSON.parse(defaulted.stdout.join(""))).toMatchObject({ result: { scope: "full" } });
    }
  );
});

describe("read-only CLI behavior", () => {
  it.each(["new", "retrofit"] as const)(
    "returns an unapproved %s proposal without applying changes",
    async (command) => {
      const repository = await temporaryRepository({
        "src/index.ts":
          "export function value(input: string): string { return input.trim().toUpperCase(); }"
      });
      const before = await repository.snapshot();
      const output = captureIo(repository.root);
      await expect(runCli([command, "--format", "json"], output.io)).resolves.toBe(0);
      expect(JSON.parse(output.stdout.join(""))).toMatchObject({
        command,
        ok: true,
        result: {
          appliedChanges: [],
          proposal: { approved: false, plannedChanges: expect.any(Array) }
        }
      });
      expect(await repository.snapshot()).toEqual(before);
    }
  );

  it("audits successfully without writing repository state", async () => {
    const repository = await temporaryRepository({ "README.md": "# Project" });
    const before = await repository.snapshot();
    const output = captureIo(repository.root);
    await expect(runCli(["audit"], output.io)).resolves.toBe(0);
    expect(output.stdout.join("")).toContain("DevCharter audit");
    expect(output.stdout.join("")).toContain("Applied changes: 0");
    expect(await repository.snapshot()).toEqual(before);
  });

  it("rejects a failing audit invocation before touching repository state", async () => {
    const repository = await temporaryRepository({ "README.md": "# Project" });
    const before = await repository.snapshot();
    const output = captureIo(repository.root);
    await expect(runCli(["audit", "--scope", "unsupported"], output.io)).resolves.toBe(2);
    expect(output.stderr.join("")).toContain("--scope must be full");
    expect(await repository.snapshot()).toEqual(before);
  });

  it.each(["new", "retrofit", "audit"] as const)(
    "emits the complete stable human and JSON result contract for %s",
    async (command) => {
      const repository = await temporaryRepository({
        "README.md": "# Project",
        "AGENTS.md": "# Project instructions",
        "package.json": '{"scripts":{"test":"vitest"}}'
      });
      const before = await repository.snapshot();
      const human = captureIo(repository.root);
      await expect(runCli([command], human.io)).resolves.toBe(0);
      const output = human.stdout.join("");
      for (const label of [
        "Facts:",
        "Findings:",
        "Assumptions:",
        "Questions:",
        "Critical journeys:",
        "Considered components:",
        "Planned changes:",
        "Preserved paths:",
        "Conflicts:",
        "Risks:",
        "Validation:",
        "Deferred work:",
        "Applied changes:"
      ]) {
        expect(output).toContain(label);
      }
      expect(output).toContain(command === "audit" ? "Proposal: none" : "Proposal revision:");

      const json = captureIo(repository.root);
      await expect(runCli([command, "--format", "json"], json.io)).resolves.toBe(0);
      const parsed = JSON.parse(json.stdout.join("")) as {
        result: Record<string, unknown>;
      };
      expect(Object.keys(parsed.result).sort()).toEqual(
        [
          "appliedChanges",
          "artifacts",
          "assumptions",
          "conflicts",
          "consideredComponents",
          "criticalJourneys",
          "deferredWork",
          "facts",
          "findings",
          "fingerprintInputs",
          "mode",
          "plannedChanges",
          "preservedPaths",
          ...(command === "audit" ? [] : ["proposal"]),
          "questions",
          "recommendation",
          "repositoryFingerprint",
          "risks",
          "scope",
          "semanticallyInspectedPaths",
          "summary",
          "validation"
        ].sort()
      );
      expect(parsed.result.proposal === undefined).toBe(command === "audit");
      expect(await repository.snapshot()).toEqual(before);
    }
  );

  it("includes evidence, confidence, uncertainty, recommendations, and question context in human output", async () => {
    const repository = await temporaryRepository({
      "Cargo.toml": '[package]\nname = "demo"\nversion = "0.1.0"\n',
      "README.md": "Run `cargo custom-plugin` before release."
    });
    const audit = captureIo(repository.root);
    await expect(runCli(["audit", "--scope", "engineering"], audit.io)).resolves.toBe(0);
    const auditOutput = audit.stdout.join("");
    expect(auditOutput).toContain("confidence]");
    expect(auditOutput).toContain("Evidence:");
    expect(auditOutput).toContain("Uncertainty:");
    expect(auditOutput).toContain("Recommended action:");
    const diagnosticStart = auditOutput
      .split("\n")
      .findIndex((line) => line.startsWith("- COMMAND_VALIDATION_UNCERTAIN"));
    expect(auditOutput.split("\n").slice(diagnosticStart, diagnosticStart + 4))
      .toMatchInlineSnapshot(`
      [
        "- COMMAND_VALIDATION_UNCERTAIN [low; low confidence]: Documented cargo command is not a bounded standard command: custom-plugin",
        "  Evidence: README.md, Cargo.toml",
        "  Uncertainty: Third-party plugins and dynamically installed tools are not interpreted",
        "  Recommended action: Document the command authority or use a statically declared project command",
      ]
    `);

    const json = captureIo(repository.root);
    await expect(
      runCli(["audit", "--scope", "engineering", "--format", "json"], json.io)
    ).resolves.toBe(0);
    const parsed = JSON.parse(json.stdout.join("")) as {
      result: {
        findings: Array<Record<string, unknown>>;
        plannedChanges: unknown[];
        appliedChanges: unknown[];
      };
    };
    expect({
      finding: parsed.result.findings.find((item) => item.code === "COMMAND_VALIDATION_UNCERTAIN"),
      plannedChanges: parsed.result.plannedChanges,
      appliedChanges: parsed.result.appliedChanges
    }).toMatchInlineSnapshot(`
      {
        "appliedChanges": [],
        "finding": {
          "code": "COMMAND_VALIDATION_UNCERTAIN",
          "confidence": "low",
          "evidence": [
            {
              "source": "README.md",
            },
            {
              "source": "Cargo.toml",
            },
          ],
          "impact": "low",
          "recommendedAction": "Document the command authority or use a statically declared project command",
          "scope": "engineering",
          "summary": "Documented cargo command is not a bounded standard command: custom-plugin",
          "uncertainty": "Third-party plugins and dynamically installed tools are not interpreted",
        },
        "plannedChanges": [],
      }
    `);

    const fresh = await temporaryRepository();
    const proposed = captureIo(fresh.root);
    await expect(runCli(["new"], proposed.io)).resolves.toBe(0);
    const proposalOutput = proposed.stdout.join("");
    expect(proposalOutput).toContain("Context:");
    expect(proposalOutput).toContain("Reason:");
    expect(proposalOutput).toContain("No special project constraints are assumed");
  });

  it("produces stable human inspect output without writing", async () => {
    const repository = await temporaryRepository({ "README.md": "project" });
    const before = await repository.snapshot();
    const output = captureIo(repository.root);

    await expect(runCli(["inspect"], output.io)).resolves.toBe(0);
    expect(output.stdout.join("")).toBe(
      "DevCharter inspect\nArtifacts: 1\n- README.md [documentation; project]\n"
    );
    expect(await repository.snapshot()).toEqual(before);
  });

  it("produces stable JSON validation output and preserves command order", async () => {
    const repository = await temporaryRepository({
      ".devcharter.yaml":
        "version: 1\nverificationCommands:\n  - name: typecheck\n    command: pnpm typecheck\n  - name: test\n    command: pnpm test\n"
    });
    const before = await repository.snapshot();
    const output = captureIo(repository.root);

    await expect(runCli(["validate", "--format", "json"], output.io)).resolves.toBe(0);
    expect(JSON.parse(output.stdout.join(""))).toMatchObject({
      command: "validate",
      formatVersion: 1,
      ok: true,
      result: {
        outcome: "pass",
        changedPaths: []
      }
    });
    expect(await repository.snapshot()).toEqual(before);
  });

  it("fails deterministic repository-integrity and managed-output drift without writing", async () => {
    const repository = await temporaryRepository({
      "README.md": "See [missing](docs/missing.md).\n",
      "AGENTS.md": "# Instructions\n",
      ".agents/skills/local/SKILL.md": "---\nname: local\ndescription: Local\n---\n",
      ".agents/skills-lock.json": "{ invalid",
      ".devcharter/managed-files.json": JSON.stringify({
        version: 1,
        files: [
          {
            path: "AGENTS.md",
            adapter: "codex",
            baselineHash: "0".repeat(64),
            managed: true
          }
        ]
      })
    });
    const before = await repository.snapshot();
    const output = captureIo(repository.root);
    await expect(runCli(["validate", "--format", "json"], output.io)).resolves.toBe(1);
    const parsed = JSON.parse(output.stdout.join(""));
    expect(parsed).toMatchObject({
      ok: false,
      result: { outcome: "fail", changedPaths: [] }
    });
    expect(parsed.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: expect.stringContaining("BROKEN_REFERENCE") }),
        expect.objectContaining({ message: expect.stringContaining("SKILL_PROVENANCE_INVALID") }),
        expect.objectContaining({ path: "AGENTS.md", message: expect.stringContaining("drifted") })
      ])
    );
    expect(await repository.snapshot()).toEqual(before);
  });

  it("keeps subjective ecosystem recommendations out of deterministic validation", async () => {
    const repository = await temporaryRepository({
      "package.json": '{"scripts":{"build":"tsc"}}',
      "src/index.ts": "export const established = true;"
    });
    const output = captureIo(repository.root);
    await expect(runCli(["validate", "--format", "json"], output.io)).resolves.toBe(0);
    expect(JSON.parse(output.stdout.join(""))).toMatchObject({
      ok: true,
      result: { outcome: "pass" }
    });
  });

  it("reports valid legacy YAML as a warning without writing", async () => {
    const repository = await temporaryRepository({ ".ai/legacy.yaml": "name: old" });
    const before = await repository.snapshot();
    const output = captureIo(repository.root);

    await expect(runCli(["validate"], output.io)).resolves.toBe(0);
    expect(output.stdout.join("")).toContain("Outcome: warning");
    expect(output.stdout.join("")).toContain("Explicit migration required for .ai/legacy.yaml");
    expect(await repository.snapshot()).toEqual(before);
  });

  it("reports malformed legacy YAML as a failure without writing", async () => {
    const repository = await temporaryRepository({ ".ai/broken.yaml": "value: [broken" });
    const before = await repository.snapshot();
    const output = captureIo(repository.root);

    await expect(runCli(["validate", "--format", "json"], output.io)).resolves.toBe(1);
    expect(JSON.parse(output.stdout.join(""))).toMatchObject({
      ok: false,
      result: { outcome: "fail" },
      errors: [{ code: "UNSAFE_YAML", path: ".ai/broken.yaml" }]
    });
    expect(await repository.snapshot()).toEqual(before);
  });
});

describe("built CLI integration", () => {
  it("runs from the current working directory without changing it", async () => {
    const repository = await temporaryRepository({ "package.json": "{}" });
    const before = await repository.snapshot();
    const cliPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
    const execution = await execFileAsync(
      process.execPath,
      [cliPath, "inspect", "--format", "json"],
      { cwd: repository.root, windowsHide: true }
    );

    expect(JSON.parse(execution.stdout)).toMatchObject({
      command: "inspect",
      ok: true,
      result: {
        artifacts: [{ path: "package.json", kind: "configuration", origin: "project" }]
      }
    });
    expect(execution.stderr).toBe("");
    expect(await repository.snapshot()).toEqual(before);
  });

  it("has no writer, network, telemetry, Commander, or minimatch dependency", async () => {
    const sources = await Promise.all(
      ["./index.ts", "./cli.ts"].map((source) => readFile(new URL(source, import.meta.url), "utf8"))
    );
    const source = sources.join("\n");
    const manifest = await readFile(new URL("../package.json", import.meta.url), "utf8");
    const parsedManifest = JSON.parse(manifest) as { version: string };

    expect(source).not.toContain("@devcharter/core/writer");
    expect(source).not.toMatch(/node:(http|https|net)|\bfetch\s*\(|telemetry/i);
    expect(manifest).not.toMatch(/commander|minimatch/i);
    expect(DEVCHARTER_VERSION).toBe(parsedManifest.version);
  });
});

describe("bounded Project Architect output", () => {
  it("previews at most 20 preserved paths in human output while JSON stays complete", async () => {
    const files = Object.fromEntries(
      Array.from({ length: 35 }, (_, index) => [
        `docs/note-${String(index).padStart(2, "0")}.md`,
        `# Note ${index}\n\nCurrent repository note ${index}.`
      ])
    );
    const repository = await temporaryRepository(files);
    const human = captureIo(repository.root);
    await expect(runCli(["audit", "--scope", "governance"], human.io)).resolves.toBe(0);
    const humanOutput = human.stdout.join("");
    expect(humanOutput).toContain("Preserved paths: 35");
    expect(humanOutput).toContain("15 additional preserved path(s) omitted; use JSON");
    expect(humanOutput.match(/^- docs\/note-/gm) ?? []).toHaveLength(20);

    const json = captureIo(repository.root);
    await expect(
      runCli(["audit", "--scope", "governance", "--format", "json"], json.io)
    ).resolves.toBe(0);
    const parsed = JSON.parse(json.stdout.join("")) as {
      result: { preservedPaths: string[] };
    };
    expect(parsed.result.preservedPaths).toHaveLength(35);
  });
});
