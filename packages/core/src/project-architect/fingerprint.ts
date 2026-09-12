import type { FingerprintExclusion, JsonValue, RepositoryFingerprintInputs } from "../model.js";
import { compareCanonicalText, stableHash } from "../serialization.js";

const APPROVAL_RELEVANT_EXCLUSION_REASONS = new Set<FingerprintExclusion["reason"]>([
  "oversized",
  "external-symlink",
  "unsupported-type",
  "unsafe"
]);

function exclusionKey(exclusion: FingerprintExclusion): string {
  return [
    exclusion.path.replace(/\\/g, "/"),
    exclusion.reason,
    exclusion.detail ?? "",
    exclusion.uncertainty ?? ""
  ].join("\0");
}

export function approvalRelevantExclusions(
  exclusions: readonly FingerprintExclusion[]
): FingerprintExclusion[] {
  return exclusions
    .filter(
      (exclusion) =>
        APPROVAL_RELEVANT_EXCLUSION_REASONS.has(exclusion.reason) ||
        exclusion.uncertainty !== undefined
    )
    .map((exclusion) => ({
      path: exclusion.path.replace(/\\/g, "/"),
      reason: exclusion.reason,
      ...(exclusion.detail === undefined
        ? {}
        : { detail: exclusion.detail.replace(/\r\n?/g, "\n") }),
      ...(exclusion.uncertainty === undefined
        ? {}
        : { uncertainty: exclusion.uncertainty.replace(/\r\n?/g, "\n") })
    }))
    .sort((left, right) => compareCanonicalText(exclusionKey(left), exclusionKey(right)));
}

export function computeScopedRepositoryFingerprint(inputs: RepositoryFingerprintInputs): string {
  return stableHash({
    algorithmVersion: inputs.algorithmVersion,
    scope: inputs.scope,
    includedPaths: [...inputs.includedPaths].sort((left, right) =>
      compareCanonicalText(
        `${left.path}\0${left.reason}\0${left.role}`,
        `${right.path}\0${right.reason}\0${right.role}`
      )
    ),
    excludedPaths: approvalRelevantExclusions(inputs.excludedPaths),
    gitFacts: inputs.gitFacts
      .filter((fact) => fact.available)
      .map(({ name, value, available }) => ({
        name,
        ...(value === undefined ? {} : { value }),
        available
      }))
      .sort((left, right) => compareCanonicalText(left.name, right.name))
  } as JsonValue);
}
