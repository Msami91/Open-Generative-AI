// Pure guard tests for the Wan2GP cloud billing boundary.
const { estimateBenchmarkCost, estimateFingerprint, buildPaidRunGate } = require("./cloudCostGuard");

const assert = (condition, message) => { if (!condition) throw new Error(message); };

const estimate = estimateBenchmarkCost({
  hourlyGpuUsd: 0.99,
  runtimeMinutes: 15,
  startupMinutes: 5,
});

const fp = estimateFingerprint(estimate);
assert(buildPaidRunGate({ estimate }).canProvision === false, "Missing approval must fail closed.");
assert(buildPaidRunGate({ estimate, approved: true }).canProvision === false, "Missing fingerprint must fail closed.");
assert(buildPaidRunGate({
  estimate,
  approved: true,
  approvedEstimateFingerprint: fp,
}).canProvision === true, "Exact approved estimate must pass.");

const repriced = estimateBenchmarkCost({
  hourlyGpuUsd: 1.09,
  runtimeMinutes: 15,
  startupMinutes: 5,
});
assert(buildPaidRunGate({
  estimate: repriced,
  approved: true,
  approvedEstimateFingerprint: fp,
}).canProvision === false, "Repricing must invalidate approval.");

console.log("Wan2GP paid-run boundary smoke tests passed");
