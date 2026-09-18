import { buildCloudBenchmarkPlan } from "./sami01Episode02Choice.js";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const plan = buildCloudBenchmarkPlan({
  provider: "dry-run-cloud",
  model: "wan2gp:wan22-i2v",
  hourlyGpuUsd: 1,
  estimatedRuntimeMinutes: 15,
  storageUsd: 0.05,
});

assert(plan.benchmark.id === "sami-01-s01-e02-choice", "Wrong benchmark.");
assert(plan.benchmark.target.aspectRatio === "9:16", "Episode 02 must remain vertical.");
assert(plan.benchmark.target.durationSeconds === 8, "Benchmark duration drifted.");
assert(plan.estimate.computeUsd === 0.25, "Compute estimate is incorrect.");
assert(plan.estimate.estimatedTotalUsd === 0.30, "Total estimate is incorrect.");
assert(plan.requiresExplicitPaidRunApproval === true, "Paid benchmark must fail closed on approval.");

let rejectedBadPrice = false;
try {
  buildCloudBenchmarkPlan({
    provider: "dry-run-cloud",
    model: "wan2gp:wan22-i2v",
    hourlyGpuUsd: -1,
    estimatedRuntimeMinutes: 10,
  });
} catch {
  rejectedBadPrice = true;
}
assert(rejectedBadPrice, "Negative GPU prices must be rejected.");

console.log("SAMI-01 Episode 02 benchmark smoke tests passed");
