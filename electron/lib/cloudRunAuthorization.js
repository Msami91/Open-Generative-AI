// Unified authorization envelope for a paid cloud generation.
// Binds the user's generation approval and cost approval to one exact run.
// This module is pure and performs no network or provisioning.

const crypto = require("crypto");
const { buildPaidRunGate } = require("./cloudCostGuard");

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function createCloudRunFingerprint({
  benchmarkId,
  generationFingerprint,
  estimateFingerprint,
  provider,
  model,
  endpointMode,
  endpointUrl,
} = {}) {
  for (const [name, value] of Object.entries({
    benchmarkId, generationFingerprint, estimateFingerprint, provider, model, endpointMode,
  })) {
    if (typeof value !== "string" || !value.trim()) throw new Error(`${name} is required.`);
  }
  if (endpointMode !== "cloud") throw new Error("Paid cloud authorization requires endpointMode=cloud.");
  let endpoint;
  try { endpoint = new URL(String(endpointUrl || "").trim()); }
  catch { throw new Error("A valid cloud endpoint URL is required."); }
  if (endpoint.protocol !== "https:") throw new Error("Cloud run authorization requires HTTPS.");
  if (endpoint.username || endpoint.password) throw new Error("Cloud endpoint must not embed credentials.");
  const normalizedEndpoint = endpoint.toString().replace(/\/+$/, "");
  return `cloudrun-${hash({
    benchmarkId,
    generationFingerprint,
    estimateFingerprint,
    provider,
    model,
    endpointMode,
    endpointUrl: normalizedEndpoint,
  })}`;
}

function authorizePaidCloudRun({
  benchmarkId,
  generationFingerprint,
  generationApproved = false,
  approvedGenerationFingerprint,
  estimate,
  paidRunApproved = false,
  approvedEstimateFingerprint,
  provider,
  model,
  endpointMode,
  endpointUrl,
  approvedCloudRunFingerprint,
} = {}) {
  if (generationApproved !== true || approvedGenerationFingerprint !== generationFingerprint) {
    throw new Error("Exact generation approval is required for this cloud run.");
  }

  const paidGate = buildPaidRunGate({
    estimate,
    approved: paidRunApproved,
    approvedEstimateFingerprint,
  });
  if (!paidGate.canProvision) throw new Error(paidGate.reason);

  const cloudRunFingerprint = createCloudRunFingerprint({
    benchmarkId,
    generationFingerprint,
    estimateFingerprint: paidGate.estimateFingerprint,
    provider,
    model,
    endpointMode,
    endpointUrl,
  });
  if (approvedCloudRunFingerprint !== cloudRunFingerprint) {
    throw new Error("Cloud run inputs changed after approval. Review and approve the exact run again.");
  }

  return Object.freeze({
    canRun: true,
    benchmarkId,
    generationFingerprint,
    estimateFingerprint: paidGate.estimateFingerprint,
    cloudRunFingerprint,
    provider,
    model,
    endpointMode,
  });
}

module.exports = { createCloudRunFingerprint, authorizePaidCloudRun };
