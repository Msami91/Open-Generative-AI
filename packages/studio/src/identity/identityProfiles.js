// Canonical identity profiles.
// Keep identity metadata separate from scene, wardrobe, motion, and generated
// assets. References are intentionally not hard-coded here: the user must
// explicitly approve original source images before they enter the vault.

export const IDENTITY_PROFILE_STATUS = Object.freeze({
  LOCKED: "locked",
  DRAFT: "draft",
});

export const SAMI_01 = Object.freeze({
  id: "SAMI-01",
  displayName: "SAMI-01",
  status: IDENTITY_PROFILE_STATUS.LOCKED,
  policy: Object.freeze({
    requireExplicitReferenceApproval: true,
    allowGeneratedIdentityReferences: false,
    allowSceneReferencesAsIdentity: false,
    allowClothingReferencesAsIdentity: false,
    allowMotionReferencesAsIdentity: false,
  }),
});

export const IDENTITY_PROFILES = Object.freeze([SAMI_01]);

export function getIdentityProfile(identityId) {
  return IDENTITY_PROFILES.find(({ id }) => id === identityId) || null;
}
