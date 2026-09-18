const { buildWan2gpCloudDeployment } = require("./wan2gpCloudDeployment.js");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const deployment = buildWan2gpCloudDeployment({
  provider: "dry-run-cloud",
  gpuProfile: "rtx-5090-32gb",
  hourlyGpuUsd: 0.99,
  persistentStorageGb: 60,
  autoStopMinutes: 15,
});

assert(deployment.engine === "Wan2GP", "Wrong engine.");
assert(deployment.billingGuard.provisionAutomatically === false, "Cloud must never auto-provision.");
assert(deployment.billingGuard.paidRunRequiresExplicitApproval === true, "Paid run must require approval.");
assert(deployment.billingGuard.autoStopRequired === true, "Auto-stop guard is required.");

let blockedSmallDisk = false;
try {
  buildWan2gpCloudDeployment({
    provider: "dry-run-cloud",
    gpuProfile: "rtx-5090-32gb",
    hourlyGpuUsd: 0.99,
    persistentStorageGb: 20,
  });
} catch {
  blockedSmallDisk = true;
}
assert(blockedSmallDisk, "Unsafe storage configuration must fail closed.");

console.log("Wan2GP cloud deployment smoke tests passed");
