import { describe, expect, it } from "vitest";

import {
  CHANGE_ACTIONS,
  MODES,
  SCOPES,
  SPEC_STATUSES,
  ecosystemProposalSchema,
  projectFactSchema,
  validationResultSchema
} from "./model.js";

describe("canonical concepts", () => {
  it("exposes only the approved modes, scopes, statuses, and change actions", () => {
    expect(MODES).toEqual(["new", "retrofit", "audit"]);
    expect(SCOPES).toEqual(["full", "governance", "engineering", "ai"]);
    expect(SPEC_STATUSES).toEqual(["draft", "ready", "active", "done", "cancelled"]);
    expect(CHANGE_ACTIONS).toEqual(["create", "update", "skip", "conflict"]);
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

  it("validates a cohesive ecosystem proposal", () => {
    const result = ecosystemProposalSchema.safeParse({
      mode: "retrofit",
      scope: "full",
      repositoryFingerprint: "abc123",
      revision: 1,
      approved: false,
      facts: [],
      assumptions: [],
      findings: [],
      desiredOutcome: "A dependable repository foundation",
      consideredComponents: [],
      plannedChanges: [],
      risks: [],
      validation: [],
      deferredWork: []
    });

    expect(result.success).toBe(true);
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
