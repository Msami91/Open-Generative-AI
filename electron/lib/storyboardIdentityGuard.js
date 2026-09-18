// Storyboard identity gate for SAMI-01.
// Prevents storyboard frames from using text-only or generated/look-alike
// identity sources. Creative framing/wardrobe may vary independently.

const crypto = require("crypto");

const ALLOWED_SOURCE_TYPES = new Set(["real-photo"]);
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
}
function hash(v) {
  return crypto.createHash("sha256").update(JSON.stringify(stable(v))).digest("hex");
}

function validateStoryboardIdentity({
  identityId,
  references,
  storyboard,
} = {}) {
  if (identityId !== "SAMI-01") throw new Error("Storyboard identity must be SAMI-01.");
  if (!Array.isArray(references) || references.length < 1) {
    throw new Error("At least one approved real SAMI-01 photo is required before storyboard rendering.");
  }
  for (const ref of references) {
    if (!ref || ref.identityId !== "SAMI-01") throw new Error("Every storyboard identity reference must belong to SAMI-01.");
    if (ref.approved !== true) throw new Error("Every storyboard identity reference must be explicitly approved.");
    if (!ALLOWED_SOURCE_TYPES.has(ref.sourceType)) throw new Error("Generated, scene, clothing, or look-alike images cannot establish SAMI-01 storyboard identity.");
    if (typeof ref.id !== "string" || !ref.id.trim()) throw new Error("Storyboard identity reference id is required.");
  }
  if (!storyboard || typeof storyboard !== "object") throw new Error("Storyboard is required.");
  const identityReferenceIds = references.map(r => r.id).sort();
  return Object.freeze({
    identityId,
    identityReferenceIds,
    storyboardIdentityFingerprint: "storyid-" + hash({ identityId, identityReferenceIds, storyboard }),
    wardrobeIndependent: true,
    textOnlyIdentityAllowed: false,
    generatedIdentityReferenceAllowed: false,
  });
}

module.exports = { validateStoryboardIdentity };
