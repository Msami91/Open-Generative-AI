// Stable, provider-agnostic fingerprint for the exact generation preflight.
// This binds approval to the parameters the user actually reviewed: changing
// model, references, settings, prompt, or estimate invalidates that approval.

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

function hashString(input) {
  // Renderer-safe 128-bit composite hash. This is an approval-integrity guard,
  // not a password primitive; using four independent FNV-1a lanes makes
  // accidental/stale collisions materially less plausible than the old 32-bit lane.
  const seeds = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  return seeds.map((seed, lane) => {
    let hash = seed >>> 0;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index) + lane * 0x9e37;
      hash = Math.imul(hash, 0x01000193);
      hash ^= hash >>> 13;
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }).join("");
}

export function createPreflightFingerprint({
  identityId,
  references = [],
  model = null,
  operation = "generation",
  prompt = "",
  settings = {},
  estimatedCost = null,
  currency = null,
} = {}) {
  const referenceSnapshot = references
    .filter(Boolean)
    .map(({ id, url, role, identityId: referenceIdentityId, approval }) => ({
      id,
      url,
      role,
      identityId: referenceIdentityId,
      approval,
    }))
    .sort((a, b) => `${a.role}:${a.id}`.localeCompare(`${b.role}:${b.id}`));

  const canonical = stable({
    identityId,
    references: referenceSnapshot,
    model: typeof model === "string" ? model : model?.id || null,
    operation,
    prompt,
    settings,
    estimatedCost,
    currency,
  });

  return `pf-${hashString(JSON.stringify(canonical))}`;
}

export function isApprovalCurrent(approvedFingerprint, currentFingerprint) {
  return Boolean(
    approvedFingerprint &&
      currentFingerprint &&
      approvedFingerprint === currentFingerprint,
  );
}
