import { z } from "zod";

export const MODES = ["new", "retrofit", "audit"] as const;
export const SCOPES = ["full", "governance", "engineering", "ai"] as const;
export const SPEC_STATUSES = ["draft", "ready", "active", "done", "cancelled"] as const;
export const CHANGE_ACTIONS = ["create", "update", "skip", "conflict"] as const;

export const modeSchema = z.enum(MODES);
export const proposalModeSchema = z.enum(["new", "retrofit"]);
export const scopeSchema = z.enum(SCOPES);
export const specStatusSchema = z.enum(SPEC_STATUSES);
export const changeActionSchema = z.enum(CHANGE_ACTIONS);

export type Mode = z.infer<typeof modeSchema>;
export type ProposalMode = z.infer<typeof proposalModeSchema>;
export type Scope = z.infer<typeof scopeSchema>;
export type SpecStatus = z.infer<typeof specStatusSchema>;
export type ChangeAction = z.infer<typeof changeActionSchema>;

export const confidenceSchema = z.enum(["low", "medium", "high"]);
export const factStateSchema = z.enum(["confirmed", "inferred", "assumed"]);
export const artifactOriginSchema = z.enum([
  "project",
  "devcharter",
  "third-party",
  "generated-vendor",
  "unknown"
]);
export const artifactOwnershipSchema = z.enum([
  "project",
  "devcharter-managed",
  "third-party",
  "unknown"
]);
export const findingImpactSchema = z.enum(["low", "medium", "high", "critical"]);
export const validationOutcomeSchema = z.enum(["pass", "warning", "fail"]);

export type Confidence = z.infer<typeof confidenceSchema>;
export type JsonValue = z.infer<typeof z.json>;

export const evidenceSchema = z
  .object({
    source: z.string().trim().min(1),
    detail: z.string().trim().min(1).optional()
  })
  .strict();

export const projectFactSchema = z
  .object({
    key: z.string().trim().min(1),
    value: z.json(),
    state: factStateSchema,
    evidence: z.array(evidenceSchema).min(1),
    confidence: confidenceSchema.optional()
  })
  .strict()
  .superRefine((fact, context) => {
    if (fact.state === "inferred" && fact.confidence === undefined) {
      context.addIssue({
        code: "custom",
        path: ["confidence"],
        message: "Inferred facts require confidence"
      });
    }
  });

export const artifactRecordSchema = z
  .object({
    path: z.string().trim().min(1),
    kind: z.string().trim().min(1),
    origin: artifactOriginSchema,
    ownership: artifactOwnershipSchema.optional(),
    nativeTarget: z.string().trim().min(1).optional(),
    referencedPaths: z.array(z.string().trim().min(1)).optional(),
    referencedCommands: z.array(z.string().trim().min(1)).optional(),
    managed: z.boolean().optional()
  })
  .strict();

export const findingSchema = z
  .object({
    code: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
    summary: z.string().trim().min(1),
    evidence: z.array(evidenceSchema).min(1),
    scope: scopeSchema,
    impact: findingImpactSchema,
    confidence: confidenceSchema,
    recommendedAction: z.string().trim().min(1),
    uncertainty: z.string().trim().min(1).optional(),
    question: z.string().trim().min(1).optional()
  })
  .strict();

export const plannedFileChangeSchema = z
  .object({
    path: z.string().trim().min(1),
    action: changeActionSchema,
    purpose: z.string().trim().min(1),
    reason: z.string().trim().min(1),
    origin: artifactOriginSchema,
    ownership: artifactOwnershipSchema.optional(),
    dependencies: z.array(z.string().trim().min(1)),
    maintenanceImplication: z.string().trim().min(1),
    content: z.string().optional(),
    diff: z.string().optional(),
    adapter: z.string().trim().min(1).optional(),
    validationExpectations: z.array(z.string().trim().min(1))
  })
  .strict();

export const proposalAssumptionSchema = z
  .object({
    summary: z.string().trim().min(1),
    evidence: z.array(evidenceSchema).optional()
  })
  .strict();

export const consideredComponentSchema = z
  .object({
    component: z.string().trim().min(1),
    decision: z.enum(["include", "reject", "defer"]),
    reason: z.string().trim().min(1)
  })
  .strict();

export const acceptedDecisionSchema = z
  .object({
    id: z.string().trim().min(1),
    value: z.json(),
    evidence: z.array(evidenceSchema).optional()
  })
  .strict();

export const projectQuestionSchema = z
  .object({
    id: z.string().trim().min(1),
    question: z.string().trim().min(1),
    context: z.string().trim().min(1),
    reason: z.string().trim().min(1),
    recommendedDefault: z.json().optional(),
    evidence: z.array(evidenceSchema).min(1),
    requiredForApproval: z.boolean()
  })
  .strict();

export const criticalJourneySchema = z
  .object({
    id: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    evidence: z.array(evidenceSchema).min(1),
    verification: z.string().trim().min(1)
  })
  .strict();

export const establishmentSignalSchema = z
  .object({
    kind: z.string().trim().min(1),
    strength: z.enum(["strong", "supporting", "minimal"]),
    evidence: z.array(evidenceSchema).min(1),
    confidence: confidenceSchema
  })
  .strict();

export const fingerprintPathInputSchema = z
  .object({
    path: z.string().trim().min(1),
    role: z.string().trim().min(1),
    reason: z.enum(["selected-scope", "mode-classification", "reference-dependency"]),
    type: z.enum(["text", "symlink"]),
    size: z.number().int().nonnegative().optional(),
    digest: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional()
  })
  .strict();

export const fingerprintExclusionSchema = z
  .object({
    path: z.string().trim().min(1),
    reason: z.enum([
      "dependency",
      "cache",
      "generated-vendor",
      "binary",
      "likely-secret",
      "oversized",
      "external-symlink",
      "unsupported-type",
      "unsafe",
      "out-of-scope"
    ]),
    detail: z.string().trim().min(1).optional(),
    uncertainty: z.string().trim().min(1).optional()
  })
  .strict();

export const fingerprintGitFactSchema = z
  .object({
    name: z.string().trim().min(1),
    value: z.json().optional(),
    available: z.boolean(),
    uncertainty: z.string().trim().min(1).optional()
  })
  .strict();

export const repositoryFingerprintInputsSchema = z
  .object({
    algorithmVersion: z.literal(2),
    scope: scopeSchema,
    includedPaths: z.array(fingerprintPathInputSchema),
    excludedPaths: z.array(fingerprintExclusionSchema),
    gitFacts: z.array(fingerprintGitFactSchema)
  })
  .strict();

export const proposalApprovalSchema = z
  .object({
    confirmed: z.literal(true),
    proposalRevision: z.number().int().positive(),
    proposalFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    repositoryFingerprint: z.string().regex(/^[a-f0-9]{64}$/)
  })
  .strict();

export const ecosystemProposalSchema = z
  .object({
    mode: proposalModeSchema,
    scope: scopeSchema,
    repositoryFingerprint: z.string().trim().min(1),
    proposalFingerprint: z.string().trim().min(1),
    revision: z.number().int().positive(),
    approved: z.boolean(),
    facts: z.array(projectFactSchema),
    assumptions: z.array(proposalAssumptionSchema),
    acceptedDecisions: z.array(acceptedDecisionSchema),
    questions: z.array(projectQuestionSchema),
    findings: z.array(findingSchema),
    conflicts: z.array(findingSchema),
    desiredOutcome: z.string().trim().min(1),
    criticalJourneys: z.array(criticalJourneySchema),
    consideredComponents: z.array(consideredComponentSchema),
    plannedChanges: z.array(plannedFileChangeSchema),
    preservedPaths: z.array(z.string().trim().min(1)),
    risks: z.array(z.string().trim().min(1)),
    validation: z.array(z.string().trim().min(1)),
    deferredWork: z.array(z.string().trim().min(1))
  })
  .strict()
  .superRefine((proposal, context) => {
    const plannedPaths = new Set<string>();
    for (const [index, change] of proposal.plannedChanges.entries()) {
      const normalized = change.path.replace(/\\/g, "/");
      if (plannedPaths.has(normalized)) {
        context.addIssue({
          code: "custom",
          path: ["plannedChanges", index, "path"],
          message: "A proposal may contain only one decision per target path"
        });
      }
      plannedPaths.add(normalized);
    }
    const findingKeys = new Set(
      proposal.findings.map(
        (finding) => `${finding.code}:${finding.evidence.map((entry) => entry.source).join("|")}`
      )
    );
    for (const [index, conflict] of proposal.conflicts.entries()) {
      const key = `${conflict.code}:${conflict.evidence.map((entry) => entry.source).join("|")}`;
      if (!findingKeys.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["conflicts", index],
          message: "Proposal conflicts must also appear in findings"
        });
      }
    }
  });

export const validationCheckSchema = z
  .object({
    name: z.string().trim().min(1),
    outcome: validationOutcomeSchema,
    detail: z.string().trim().min(1).optional()
  })
  .strict();

export const skippedCheckSchema = z
  .object({
    name: z.string().trim().min(1),
    reason: z.string().trim().min(1)
  })
  .strict();

export const validationResultSchema = z
  .object({
    outcome: validationOutcomeSchema,
    checksRun: z.array(validationCheckSchema),
    warnings: z.array(z.string()),
    failures: z.array(z.string()),
    changedPaths: z.array(z.string()),
    skippedChecks: z.array(skippedCheckSchema)
  })
  .strict();

export type Evidence = z.infer<typeof evidenceSchema>;
export type ProjectFact = z.infer<typeof projectFactSchema>;
export type ArtifactRecord = z.infer<typeof artifactRecordSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type PlannedFileChange = z.infer<typeof plannedFileChangeSchema>;
export type ProposalAssumption = z.infer<typeof proposalAssumptionSchema>;
export type ConsideredComponent = z.infer<typeof consideredComponentSchema>;
export type AcceptedDecision = z.infer<typeof acceptedDecisionSchema>;
export type ProjectQuestion = z.infer<typeof projectQuestionSchema>;
export type CriticalJourney = z.infer<typeof criticalJourneySchema>;
export type EstablishmentSignal = z.infer<typeof establishmentSignalSchema>;
export type FingerprintPathInput = z.infer<typeof fingerprintPathInputSchema>;
export type FingerprintExclusion = z.infer<typeof fingerprintExclusionSchema>;
export type FingerprintGitFact = z.infer<typeof fingerprintGitFactSchema>;
export type RepositoryFingerprintInputs = z.infer<typeof repositoryFingerprintInputsSchema>;
export type ProposalApproval = z.infer<typeof proposalApprovalSchema>;
export type EcosystemProposal = z.infer<typeof ecosystemProposalSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
