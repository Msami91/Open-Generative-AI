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

function buildPaidRunGate({ estimate, approved = false } = {}) {
  if (!estimate || !Number.isFinite(estimate.totalUsd)) throw new Error("A valid estimate is required.");
  return Object.freeze({
    approved: approved === true,
    canProvision: approved === true,
    estimate,
    reason: approved === true ? null : "Explicit paid-run approval required before provisioning.",
  });
}

module.exports = { estimateBenchmarkCost, buildPaidRunGate, USD_TO_SAR_PEG };
