import { describe, expect, it } from "vitest";

import {
  CHANGE_ACTIONS,
  MODES,
  SCOPES,
  SPEC_STATUSES,
  artifactRecordSchema,
  changeActionSchema,
  ecosystemProposalSchema,
  findingSchema,
  modeSchema,
  plannedFileChangeSchema,
  projectFactSchema,
  repositoryFingerprintInputsSchema,
  scopeSchema,
  specStatusSchema,
  validationResultSchema
} from "./model.js";

describe("canonical concepts", () => {
  it("exposes only the approved modes, scopes, statuses, and change actions", () => {
    expect(MODES).toEqual(["new", "retrofit", "audit"]);
    expect(SCOPES).toEqual(["full", "governance", "engineering", "ai"]);
    expect(SPEC_STATUSES).toEqual(["draft", "ready", "active", "done", "cancelled"]);
    expect(CHANGE_ACTIONS).toEqual(["create", "update", "skip", "conflict"]);

    expect(MODES.every((value) => modeSchema.safeParse(value).success)).toBe(true);
    expect(SCOPES.every((value) => scopeSchema.safeParse(value).success)).toBe(true);
    expect(SPEC_STATUSES.every((value) => specStatusSchema.safeParse(value).success)).toBe(true);
    expect(CHANGE_ACTIONS.every((value) => changeActionSchema.safeParse(value).success)).toBe(true);

    expect(modeSchema.safeParse("check").success).toBe(false);
    expect(scopeSchema.safeParse("architecture").success).toBe(false);
    expect(specStatusSchema.safeParse("blocked").success).toBe(false);
    expect(changeActionSchema.safeParse("delete").success).toBe(false);
  });

  it("requires confidence for inferred facts", () => {
    const result = projectFactSchema.safeParse({
      key: "runtime",
      value: "node",
      state: "inferred",
      evidence: [{ source: "package.json" }]
    });

    expect(result.success).toBe(false);
  });

  it("requires repository fingerprint algorithm version 2", () => {
    const inputs = {
      algorithmVersion: 2,
      scope: "engineering",
      includedPaths: [],
      excludedPaths: [],
      gitFacts: []
    };
    expect(repositoryFingerprintInputsSchema.safeParse(inputs).success).toBe(true);
    expect(
      repositoryFingerprintInputsSchema.safeParse({ ...inputs, algorithmVersion: 1 }).success
    ).toBe(false);
  });

  it("validates a cohesive ecosystem proposal", () => {
    const fact = {
      key: "runtime",
      value: "node",
      state: "inferred" as const,
      confidence: "high" as const,
      evidence: [{ source: "package.json", detail: "engines.node" }]
    };
    const artifact = {
      path: "package.json",
      kind: "configuration",
      origin: "project" as const,
      ownership: "project" as const,
      referencedCommands: ["pnpm test"],
      managed: false
    };
    const finding = {
      code: "MISSING_FOUNDATION",
      summary: "The foundation is incomplete",
      evidence: [{ source: "repository inventory" }],
      scope: "engineering" as const,
      impact: "high" as const,
      confidence: "high" as const,
      recommendedAction: "Complete the active specification"
    };
    const plannedChange = {
      path: "package.json",
      action: "update" as const,
      purpose: "Expose verification commands",
      reason: "The accepted workflow requires them",
      origin: "project" as const,
      ownership: "project" as const,
      dependencies: ["package.json"],
      maintenanceImplication: "Keep scripts synchronized",
      validationExpectations: ["pnpm test"]
    };

    expect(artifactRecordSchema.safeParse(artifact).success).toBe(true);
    expect(findingSchema.safeParse(finding).success).toBe(true);
    expect(plannedFileChangeSchema.safeParse(plannedChange).success).toBe(true);

    const proposal = {
      mode: "retrofit",
      scope: "full",
      repositoryFingerprint: "abc123",
      proposalFingerprint: "def456",
      revision: 1,
      approved: false,
      facts: [fact],
      assumptions: [{ summary: "The package scripts are authoritative", evidence: fact.evidence }],
      acceptedDecisions: [{ id: "project.outcome", value: "A dependable foundation" }],
      questions: [],
      findings: [finding],
      conflicts: [],
      desiredOutcome: "A dependable repository foundation",
      criticalJourneys: [
        {
          id: "verification",
          summary: "Run verification",
          evidence: fact.evidence,
          verification: "pnpm test"
        }
      ],
      consideredComponents: [
        { component: "CI generation", decision: "defer", reason: "Not justified by evidence" }
      ],
      plannedChanges: [plannedChange],
      preservedPaths: ["README.md"],
      risks: ["Package scripts may change"],
      validation: ["pnpm test"],
      deferredWork: ["Adapter generation"]
    };
    const result = ecosystemProposalSchema.safeParse(proposal);

    expect(result.success).toBe(true);
    expect(ecosystemProposalSchema.safeParse({ ...proposal, mode: "audit" }).success).toBe(false);
    expect(
      ecosystemProposalSchema.safeParse({
        ...proposal,
        plannedChanges: [plannedChange, plannedChange]
      }).success
    ).toBe(false);
  });

  it("keeps validation outcomes separate from specification statuses", () => {
    expect(
      validationResultSchema.safeParse({
        outcome: "pass",
        checksRun: [],
        warnings: [],
        failures: [],
        changedPaths: [],
        skippedChecks: []
      }).success
    ).toBe(true);
    expect(SPEC_STATUSES).not.toContain("pass");
  });
});
