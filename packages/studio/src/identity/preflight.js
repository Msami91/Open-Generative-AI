import {
  REFERENCE_ROLES,
  assertApprovedIdentityReferences,
} from "./referenceAuthority.js";
import { getIdentityProfile } from "./identityProfiles.js";

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

export function buildGenerationPreflight({
  identityId,
  references = [],
  model = null,
  operation = "generation",
  estimatedCost = null,
  currency = null,
  requireIdentity = true,
} = {}) {
  const profile = hasText(identityId) ? getIdentityProfile(identityId) : null;
  if (requireIdentity && !profile) {
    throw new Error("A known locked identity profile must be selected.");
  }

  const approvedIdentityReferences = requireIdentity
    ? assertApprovedIdentityReferences(references, identityId)
    : [];

  const referenceSummary = Object.fromEntries(
    Object.values(REFERENCE_ROLES).map((role) => [
      role,
      references.filter((reference) => reference?.role === role).map(({ id, url, approval }) => ({
        id,
        url,
        approval,
      })),
    ]),
  );

  return Object.freeze({
    operation,
    identity: profile,
    model,
    estimatedCost,
    currency,
    approvedIdentityReferences: Object.freeze(approvedIdentityReferences),
    references: Object.freeze(referenceSummary),
    requiresExplicitApproval: true,
  });
}

export function assertPreflightApproved(preflight, approval) {
  if (!preflight?.requiresExplicitApproval) return true;
  if (approval !== true) {
    throw new Error("Explicit user approval is required before generation.");
  }
  return true;
}
