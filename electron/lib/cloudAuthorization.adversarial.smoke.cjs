const { buildWan2gpCloudDeployment } = require("./wan2gpCloudDeployment");
const { estimateBenchmarkCost, estimateFingerprint } = require("./cloudCostGuard");
const { createCloudRunFingerprint, authorizePaidCloudRun } = require("./cloudRunAuthorization");

const assert = (condition, message) => { if (!condition) throw new Error(message); };

const deployment = buildWan2gpCloudDeployment({
  provider: "runpod",
  gpuProfile: "rtx-5090-32gb",
  hourlyGpuUsd: 0.99,
  endpointUrl: "https://example.invalid",
  persistentStorageGb: 60,
  autoStopMinutes: 15,
});
const estimate = estimateBenchmarkCost({ hourlyGpuUsd: deployment.hourlyGpuUsd, runtimeMinutes: 15, startupMinutes: 5 });
const estimateFp = estimateFingerprint(estimate);
const base = {
  benchmarkId: "sami-01-s01-e02-choice",
  generationFingerprint: "pf-e02-exact",
  generationApproved: true,
  approvedGenerationFingerprint: "pf-e02-exact",
  estimate,
  paidRunApproved: true,
  approvedEstimateFingerprint: estimateFp,
  provider: deployment.provider,
  model: "wan2gp:wan22-i2v",
  endpointMode: "cloud",
  endpointUrl: deployment.endpointUrl,
};
const approvedCloudRunFingerprint = createCloudRunFingerprint({
  benchmarkId: base.benchmarkId,
  generationFingerprint: base.generationFingerprint,
  estimateFingerprint: estimateFp,
  provider: base.provider,
  model: base.model,
  endpointMode: base.endpointMode,
  endpointUrl: base.endpointUrl,
});
assert(authorizePaidCloudRun({ ...base, approvedCloudRunFingerprint }).canRun, "Canonical Episode 02 run should authorize.");

const attacks = [
  ["missing generation approval", { generationApproved: false }],
  ["stale generation approval", { approvedGenerationFingerprint: "pf-old" }],
  ["missing cost approval", { paidRunApproved: false }],
  ["stale cost approval", { approvedEstimateFingerprint: "old" }],
  ["different benchmark", { benchmarkId: "sami-01-s01-e03-consequence" }],
  ["different provider", { provider: "other" }],
  ["different model", { model: "wan2gp:wan22-t2v" }],
  ["different endpoint", { endpointUrl: "https://other.invalid" }],
  ["local mode", { endpointMode: "local" }],
];
for (const [name, mutation] of attacks) {
  let blocked = false;
  try { authorizePaidCloudRun({ ...base, ...mutation, approvedCloudRunFingerprint }); }
  catch { blocked = true; }
  assert(blocked, `Attack was not blocked: ${name}`);
}

console.log(`adversarial cloud authorization matrix passed (${attacks.length} attacks blocked)`);
