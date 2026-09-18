const { estimateBenchmarkCost, estimateFingerprint } = require("./cloudCostGuard");
const { createCloudRunFingerprint, authorizePaidCloudRun } = require("./cloudRunAuthorization");

const assert = (condition, message) => { if (!condition) throw new Error(message); };

const estimate = estimateBenchmarkCost({ hourlyGpuUsd: 0.99, runtimeMinutes: 15, startupMinutes: 5 });
const estimateFp = estimateFingerprint(estimate);
const base = {
  benchmarkId: "sami-01-s01-e02-choice",
  generationFingerprint: "pf-generation-a",
  generationApproved: true,
  approvedGenerationFingerprint: "pf-generation-a",
  estimate,
  paidRunApproved: true,
  approvedEstimateFingerprint: estimateFp,
  provider: "runpod",
  model: "wan2gp:wan22-i2v",
  endpointMode: "cloud",
  endpointUrl: "https://example.invalid",
};
const runFp = createCloudRunFingerprint({
  benchmarkId: base.benchmarkId,
  generationFingerprint: base.generationFingerprint,
  estimateFingerprint: estimateFp,
  provider: base.provider,
  model: base.model,
  endpointMode: base.endpointMode,
  endpointUrl: base.endpointUrl,
});

assert(authorizePaidCloudRun({ ...base, approvedCloudRunFingerprint: runFp }).canRun === true, "Exact run must pass.");

for (const mutation of [
  { generationFingerprint: "pf-generation-b" },
  { provider: "other-provider" },
  { model: "wan2gp:wan22-t2v" },
  { endpointUrl: "https://other.invalid" },
]) {
  let blocked = false;
  try { authorizePaidCloudRun({ ...base, ...mutation, approvedCloudRunFingerprint: runFp }); }
  catch { blocked = true; }
  assert(blocked, `Mutation must invalidate authorization: ${JSON.stringify(mutation)}`);
}

const repriced = estimateBenchmarkCost({ hourlyGpuUsd: 1.09, runtimeMinutes: 15, startupMinutes: 5 });
let blockedReprice = false;
try {
  authorizePaidCloudRun({ ...base, estimate: repriced, approvedCloudRunFingerprint: runFp });
} catch { blockedReprice = true; }
assert(blockedReprice, "Repricing must invalidate authorization.");

console.log("unified cloud run authorization smoke tests passed");
