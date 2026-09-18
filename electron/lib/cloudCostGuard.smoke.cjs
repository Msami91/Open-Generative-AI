const { estimateBenchmarkCost, buildPaidRunGate } = require("./cloudCostGuard.js");

const assert = (condition, message) => { if (!condition) throw new Error(message); };

const estimate = estimateBenchmarkCost({
  hourlyGpuUsd: 0.99,
  runtimeMinutes: 15,
  startupMinutes: 5,
  storageUsd: 0,
  egressUsd: 0,
});

assert(estimate.billableMinutes === 20, "Billable minutes are wrong.");
assert(Math.abs(estimate.totalUsd - 0.33) < 1e-9, "USD estimate is wrong.");
assert(Math.abs(estimate.totalSar - 1.2375) < 1e-9, "SAR estimate is wrong.");

const closed = buildPaidRunGate({ estimate });
assert(closed.canProvision === false, "Paid run must fail closed.");

const open = buildPaidRunGate({ estimate, approved: true });
assert(open.canProvision === true, "Explicit approval should open the gate.");

console.log("cloud cost guard smoke tests passed");
