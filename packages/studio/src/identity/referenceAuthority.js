// Identity/reference authority for media generation.
//
// This module deliberately contains no provider-specific code. It establishes
// a trust boundary between identity references and ordinary scene/media
// references so an arbitrary upload cannot silently become a person's identity.

export const REFERENCE_ROLES = Object.freeze({
  IDENTITY: "identity",
  SCENE: "scene",
  CLOTHING: "clothing",
  MOTION: "motion",
});

export const REFERENCE_APPROVAL = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REVOKED: "revoked",
});

const ROLE_VALUES = new Set(Object.values(REFERENCE_ROLES));
const APPROVAL_VALUES = new Set(Object.values(REFERENCE_APPROVAL));

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

function freezeReference(reference) {
  return Object.freeze({ ...reference });
}

export function createReference({
  id,
  url,
  role,
  identityId = null,
  approval = REFERENCE_APPROVAL.PENDING,
  source = "upload",
  label = null,
} = {}) {
  if (!hasText(id)) throw new Error("Reference id is required.");
  if (!hasText(url)) throw new Error("Reference URL is required.");
  if (!ROLE_VALUES.has(role)) throw new Error(`Unsupported reference role: ${role}`);
  if (!APPROVAL_VALUES.has(approval)) {
    throw new Error(`Unsupported reference approval state: ${approval}`);
  }

  if (role === REFERENCE_ROLES.IDENTITY && !hasText(identityId)) {
    throw new Error("Identity references must belong to an identity profile.");
  }
  if (role !== REFERENCE_ROLES.IDENTITY && identityId !== null) {
    throw new Error("Only identity references may carry an identityId.");
  }

  return freezeReference({
    id: id.trim(),
    url: url.trim(),
    role,
    identityId: identityId?.trim?.() || null,
    approval,
    source,
    label,
  });
}

export function isApprovedIdentityReference(reference, identityId) {
  return Boolean(
    reference &&
      reference.role === REFERENCE_ROLES.IDENTITY &&
      reference.approval === REFERENCE_APPROVAL.APPROVED &&
      hasText(reference.identityId) &&
      reference.identityId === identityId &&
      hasText(reference.url),
  );
}

export function getApprovedIdentityReferences(references, identityId) {
  if (!hasText(identityId)) return [];
  return (Array.isArray(references) ? references : []).filter((reference) =>
    isApprovedIdentityReference(reference, identityId),
  );
}

export function assertApprovedIdentityReferences(references, identityId, { min = 1 } = {}) {
  if (!hasText(identityId)) throw new Error("An identity profile must be selected.");
  const approved = getApprovedIdentityReferences(references, identityId);
  if (approved.length < min) {
    throw new Error(
      `Identity ${identityId} requires at least ${min} approved identity reference${min === 1 ? "" : "s"}.`,
    );
  }
  return approved;
}

export function buildReferenceManifest({
  identityId = null,
  references = [],
} = {}) {
  const normalized = Array.isArray(references) ? references.filter(Boolean) : [];
  const byRole = Object.fromEntries(
    Object.values(REFERENCE_ROLES).map((role) => [
      role,
      normalized.filter((reference) => reference.role === role),
    ]),
  );

  return Object.freeze({
    identityId,
    references: Object.freeze([...normalized]),
    byRole: Object.freeze(byRole),
  });
}

// Provider payloads that require a person's identity must be built from this
// function (or a future authority adapter), never directly from upload history.
export function identityUrlsForGeneration(references, identityId, options) {
  return assertApprovedIdentityReferences(references, identityId, options).map(
    ({ url }) => url,
  );
}
