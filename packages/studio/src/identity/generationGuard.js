import { buildGenerationPreflight, assertPreflightApproved } from "./preflight.js";
import { identityUrlsForGeneration } from "./referenceAuthority.js";
import { createPreflightFingerprint, isApprovalCurrent } from "./preflightFingerprint.js";

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
  prompt = "",
  settings = {},
  estimatedCost = null,
  currency = null,
  approval = false,
  approvedFingerprint = null,
  minIdentityReferences = 1,
} = {}) {
  const currentFingerprint = createPreflightFingerprint({
    identityId,
    references,
    model,
    operation,
    prompt,
    settings,
    estimatedCost,
    currency,
  });

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
  if (!isApprovalCurrent(approvedFingerprint, currentFingerprint)) {
    throw new Error(
      "Generation inputs changed after approval. Review and approve the current preflight again.",
    );
  }

  return Object.freeze({
    preflight: Object.freeze({ ...preflight, fingerprint: currentFingerprint }),
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
