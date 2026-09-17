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
  // FNV-1a 32-bit is sufficient here: this is a stale-approval guard, not a
  // cryptographic identity primitive.
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
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
