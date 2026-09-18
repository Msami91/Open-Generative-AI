// Creative review gate for SAMI-01 story episodes.
// Storyboard and music plan are creative inputs and must be reviewed before
// any paid provider call. This module performs no network or provider action.

const crypto = require("crypto");
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
}
function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}
function createCreativeReviewFingerprint({ episodeId, storyboard, musicPlan, storyboardIdentity } = {}) {
  if (typeof episodeId !== "string" || !episodeId.trim()) throw new Error("episodeId is required.");
  if (!storyboard || typeof storyboard !== "object") throw new Error("storyboard is required.");
  if (!musicPlan || typeof musicPlan !== "object") throw new Error("musicPlan is required.");
  if (!storyboardIdentity?.storyboardIdentityFingerprint) throw new Error("Verified SAMI-01 storyboard identity is required.");
  return `creative-${digest({ episodeId, storyboard, musicPlan, storyboardIdentityFingerprint: storyboardIdentity.storyboardIdentityFingerprint })}`;
}
function authorizeCreativeReview({
  episodeId,
  storyboard,
  musicPlan,
  storyboardIdentity,
  approved = false,
  approvedCreativeFingerprint = null,
} = {}) {
  const fingerprint = createCreativeReviewFingerprint({ episodeId, storyboard, musicPlan, storyboardIdentity });
  if (approved !== true || approvedCreativeFingerprint !== fingerprint) {
    throw new Error("Explicit approval of the exact storyboard and music plan is required before generation.");
  }
  return Object.freeze({ approved: true, creativeFingerprint: fingerprint, episodeId });
}
module.exports = { createCreativeReviewFingerprint, authorizeCreativeReview };
