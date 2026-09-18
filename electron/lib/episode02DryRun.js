// End-to-end dry-run planner for SAMI-01 Episode 02.
// It creates the exact cloud authorization envelope but NEVER calls a provider.

const crypto = require("crypto");
const { estimateBenchmarkCost, estimateFingerprint } = require("./cloudCostGuard");
const { createCloudRunFingerprint, authorizePaidCloudRun } = require("./cloudRunAuthorization");

const BENCHMARK = Object.freeze({
  id: "sami-01-s01-e02-choice",
  identityId: "SAMI-01",
  model: "wan2gp:wan22-i2v",
  operation: "image-to-video",
  aspectRatio: "9:16",
  durationSeconds: 8,
  resolution: "720p",
  fps: 24,
});

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}
function sha256(value) {
  return crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function createEpisode02DryRun({
  identityReferenceIds,
  prompt,
  provider,
  endpointUrl,
  hourlyGpuUsd,
  runtimeMinutes,
  startupMinutes = 0,
  storageUsd = 0,
  egressUsd = 0,
} = {}) {
  if (!Array.isArray(identityReferenceIds) || identityReferenceIds.length < 1) {
    throw new Error("At least one approved SAMI-01 identity reference id is required.");
  }
  if (identityReferenceIds.some((id) => typeof id !== "string" || !id.trim())) {
    throw new Error("Identity reference ids must be non-empty strings.");
  }
  if (typeof prompt !== "string" || !prompt.trim()) throw new Error("Episode 02 prompt is required.");
  if (typeof provider !== "string" || !provider.trim()) throw new Error("Cloud provider is required.");

  let endpoint;
  try { endpoint = new URL(String(endpointUrl || "").trim()); }
  catch { throw new Error("A valid cloud endpoint URL is required."); }
  if (endpoint.protocol !== "https:") throw new Error("Episode 02 cloud dry-run requires HTTPS.");
  if (endpoint.username || endpoint.password) throw new Error("Cloud endpoint must not embed credentials.");
  const normalizedEndpoint = endpoint.toString().replace(/\/+$/, "");

  const generationSnapshot = Object.freeze({
    benchmarkId: BENCHMARK.id,
    identityId: BENCHMARK.identityId,
    identityReferenceIds: [...identityReferenceIds].sort(),
    model: BENCHMARK.model,
    operation: BENCHMARK.operation,
    prompt: prompt.trim(),
    settings: {
      aspectRatio: BENCHMARK.aspectRatio,
      durationSeconds: BENCHMARK.durationSeconds,
      resolution: BENCHMARK.resolution,
      fps: BENCHMARK.fps,
    },
  });
  const generationFingerprint = `e02gen-${sha256(generationSnapshot)}`;
  const costEstimate = estimateBenchmarkCost({
    hourlyGpuUsd, runtimeMinutes, startupMinutes, storageUsd, egressUsd,
  });
  const costFingerprint = estimateFingerprint(costEstimate);
  const cloudRunFingerprint = createCloudRunFingerprint({
    benchmarkId: BENCHMARK.id,
    generationFingerprint,
    estimateFingerprint: costFingerprint,
    provider,
    model: BENCHMARK.model,
    endpointMode: "cloud",
    endpointUrl: normalizedEndpoint,
  });

  return Object.freeze({
    dryRun: true,
    networkCalls: 0,
    providerCalls: 0,
    benchmark: BENCHMARK,
    generationSnapshot,
    generationFingerprint,
    costEstimate,
    costFingerprint,
    cloudRunFingerprint,
    authorizationEnvelope: Object.freeze({
      cloudRun: true,
      benchmarkId: BENCHMARK.id,
      generationFingerprint,
      generationApproved: true,
      approvedGenerationFingerprint: generationFingerprint,
      costEstimate,
      paidRunApproved: true,
      approvedEstimateFingerprint: costFingerprint,
      cloudProvider: provider,
      model: BENCHMARK.model,
      endpointMode: "cloud",
      endpointUrl: normalizedEndpoint,
      approvedCloudRunFingerprint: cloudRunFingerprint,
    }),
    providerPayload: Object.freeze({
      model: BENCHMARK.model,
      prompt: prompt.trim(),
      aspect_ratio: BENCHMARK.aspectRatio,
      duration: BENCHMARK.durationSeconds,
      resolution: BENCHMARK.resolution,
      cloudRun: true,
      benchmarkId: BENCHMARK.id,
      generationFingerprint,
      generationApproved: true,
      approvedGenerationFingerprint: generationFingerprint,
      costEstimate,
      paidRunApproved: true,
      approvedEstimateFingerprint: costFingerprint,
      cloudProvider: provider,
      approvedCloudRunFingerprint: cloudRunFingerprint,
    }),
  });
}

function verifyEpisode02DryRun(plan) {
  if (!plan?.dryRun || plan.networkCalls !== 0 || plan.providerCalls !== 0) {
    throw new Error("Only a zero-network dry-run plan can be verified here.");
  }
  const a = plan.authorizationEnvelope;
  return authorizePaidCloudRun({
    benchmarkId: a.benchmarkId,
    generationFingerprint: a.generationFingerprint,
    generationApproved: a.generationApproved,
    approvedGenerationFingerprint: a.approvedGenerationFingerprint,
    estimate: a.costEstimate,
    paidRunApproved: a.paidRunApproved,
    approvedEstimateFingerprint: a.approvedEstimateFingerprint,
    provider: a.cloudProvider,
    model: a.model,
    endpointMode: a.endpointMode,
    endpointUrl: a.endpointUrl,
    approvedCloudRunFingerprint: a.approvedCloudRunFingerprint,
  });
}

module.exports = { BENCHMARK, createEpisode02DryRun, verifyEpisode02DryRun };
