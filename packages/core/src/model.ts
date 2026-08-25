import { z } from "zod";

export const MODES = ["new", "retrofit", "audit"] as const;
export const SCOPES = ["full", "governance", "engineering", "ai"] as const;
export const SPEC_STATUSES = ["draft", "ready", "active", "done", "cancelled"] as const;
export const CHANGE_ACTIONS = ["create", "update", "skip", "conflict"] as const;

export const modeSchema = z.enum(MODES);
export const scopeSchema = z.enum(SCOPES);
export const specStatusSchema = z.enum(SPEC_STATUSES);
export const changeActionSchema = z.enum(CHANGE_ACTIONS);

export type Mode = z.infer<typeof modeSchema>;
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
    content: z.string().optional(),
    diff: z.string().optional(),
    adapter: z.string().trim().min(1).optional(),
    validationExpectations: z.array(z.string().trim().min(1))
  })
  .strict()
  .superRefine((change, context) => {
    if (
      (change.action === "create" || change.action === "update") &&
      change.content === undefined &&
      change.diff === undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["content"],
        message: "Create and update changes require proposed content or a diff"
      });
    }
  });

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

export const ecosystemProposalSchema = z
  .object({
    mode: modeSchema,
    scope: scopeSchema,
    repositoryFingerprint: z.string().trim().min(1),
    revision: z.number().int().positive(),
    approved: z.boolean(),
    facts: z.array(projectFactSchema),
    assumptions: z.array(proposalAssumptionSchema),
    findings: z.array(findingSchema),
    desiredOutcome: z.string().trim().min(1),
    consideredComponents: z.array(consideredComponentSchema),
    plannedChanges: z.array(plannedFileChangeSchema),
    risks: z.array(z.string().trim().min(1)),
    validation: z.array(z.string().trim().min(1)),
    deferredWork: z.array(z.string().trim().min(1))
  })
  .strict();

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
export type EcosystemProposal = z.infer<typeof ecosystemProposalSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
