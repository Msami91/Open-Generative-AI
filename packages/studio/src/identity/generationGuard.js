import { buildGenerationPreflight, assertPreflightApproved } from "./preflight.js";
import { identityUrlsForGeneration } from "./referenceAuthority.js";

/**
 * Fail-closed identity guard for provider-bound generation requests.
 *
 * Identity-aware call sites must pass an explicit identity context. The guard
 * resolves provider identity URLs only from approved vault references and
 * refuses to proceed until the exact preflight has explicit user approval.
 */
export function authorizeIdentityGeneration({
  identityId,
  references = [],
  model = null,
  operation = "generation",
  estimatedCost = null,
  currency = null,
  approval = false,
  minIdentityReferences = 1,
} = {}) {
  const preflight = buildGenerationPreflight({
    identityId,
    references,
    model,
    operation,
    estimatedCost,
    currency,
    requireIdentity: true,
  });

  assertPreflightApproved(preflight, approval);

  return Object.freeze({
    preflight,
    identityUrls: Object.freeze(
      identityUrlsForGeneration(references, identityId, {
        min: minIdentityReferences,
      }),
    ),
  });
}

export function buildIdentityGenerationContext({
  identityId,
  references = [],
  approved = false,
  preflightFingerprint = null,
} = {}) {
  return Object.freeze({
    identityId,
    references: Object.freeze([...(Array.isArray(references) ? references : [])]),
    approved: approved === true,
    preflightFingerprint,
  });
}
