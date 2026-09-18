import {
  authorizeIdentityGeneration,
  createPreflightFingerprint,
} from "./generationGuard.js";
import {
  createReference,
  REFERENCE_APPROVAL,
  REFERENCE_ROLES,
} from "./referenceAuthority.js";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const approvedRef = createReference({
  id: "sami-original-1",
  url: "https://example.invalid/sami-original-1.jpg",
  role: REFERENCE_ROLES.IDENTITY,
  identityId: "SAMI-01",
  approval: REFERENCE_APPROVAL.APPROVED,
});

const base = {
  identityId: "SAMI-01",
  references: [approvedRef],
  model: "face-swap-model",
  operation: "face-swap",
  prompt: "",
  settings: { aspect_ratio: "9:16", quality: "1080p" },
};

const fingerprint = createPreflightFingerprint(base);

let blockedWithoutApproval = false;
try {
  authorizeIdentityGeneration(base);
} catch {
  blockedWithoutApproval = true;
}
assert(blockedWithoutApproval, "Generation must fail closed without explicit approval.");

const authorized = authorizeIdentityGeneration({
  ...base,
  approval: true,
  approvedFingerprint: fingerprint,
});
assert(authorized.identityUrls.length === 1, "Approved SAMI-01 reference must resolve.");

let blockedAfterMutation = false;
try {
  authorizeIdentityGeneration({
    ...base,
    settings: { ...base.settings, quality: "4k" },
    approval: true,
    approvedFingerprint: fingerprint,
  });
} catch {
  blockedAfterMutation = true;
}
assert(blockedAfterMutation, "Changing generation inputs must invalidate approval.");

const pendingRef = createReference({
  id: "sami-pending",
  url: "https://example.invalid/sami-pending.jpg",
  role: REFERENCE_ROLES.IDENTITY,
  identityId: "SAMI-01",
  approval: REFERENCE_APPROVAL.PENDING,
});

let blockedPendingReference = false;
try {
  authorizeIdentityGeneration({
    ...base,
    references: [pendingRef],
    approval: true,
    approvedFingerprint: createPreflightFingerprint({
      ...base,
      references: [pendingRef],
    }),
  });
} catch {
  blockedPendingReference = true;
}
assert(blockedPendingReference, "Pending identity references must never reach providers.");

console.log("identity guard smoke tests passed");
