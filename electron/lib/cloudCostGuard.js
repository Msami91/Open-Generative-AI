// Dry-run cost ledger for cloud benchmarks. No provider credentials or provisioning.
const USD_TO_SAR_PEG = 3.75;

function estimateBenchmarkCost({
  hourlyGpuUsd,
  runtimeMinutes,
  startupMinutes = 0,
  storageUsd = 0,
  egressUsd = 0,
} = {}) {
  for (const [name, value] of Object.entries({ hourlyGpuUsd, runtimeMinutes, startupMinutes, storageUsd, egressUsd })) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number.`);
  }
  const billableMinutes = runtimeMinutes + startupMinutes;
  const computeUsd = hourlyGpuUsd * (billableMinutes / 60);
  const totalUsd = computeUsd + storageUsd + egressUsd;
  return Object.freeze({
    billableMinutes,
    computeUsd,
    storageUsd,
    egressUsd,
    totalUsd,
    totalSar: totalUsd * USD_TO_SAR_PEG,
    usdToSar: USD_TO_SAR_PEG,
  });
}

const crypto = require("crypto");

function estimateFingerprint(estimate) {
  const snapshot = [
    estimate.billableMinutes,
    estimate.computeUsd,
    estimate.storageUsd,
    estimate.egressUsd,
    estimate.totalUsd,
    estimate.totalSar,
    estimate.usdToSar,
  ];
  return "cost-" + crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

function buildPaidRunGate({ estimate, approved = false, approvedEstimateFingerprint = null } = {}) {
  if (!estimate || !Number.isFinite(estimate.totalUsd)) throw new Error("A valid estimate is required.");
  const fingerprint = estimateFingerprint(estimate);
  const approvalCurrent = approved === true && approvedEstimateFingerprint === fingerprint;
  return Object.freeze({
    approved: approvalCurrent,
    canProvision: approvalCurrent,
    estimate,
    estimateFingerprint: fingerprint,
    reason: approvalCurrent ? null : "Explicit approval for this exact cost estimate is required before provisioning.",
  });
}

module.exports = { estimateBenchmarkCost, estimateFingerprint, buildPaidRunGate, USD_TO_SAR_PEG };
