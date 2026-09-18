// Provider-neutral cloud deployment contract for Wan2GP.
// Configuration only: importing this module never provisions a GPU or spends money.

const SUPPORTED_GPU_PROFILES = Object.freeze({
  "rtx-4090-24gb": Object.freeze({ minVramGb: 24, recommended: false }),
  "rtx-5090-32gb": Object.freeze({ minVramGb: 32, recommended: true }),
  "a40-48gb": Object.freeze({ minVramGb: 48, recommended: false }),
  "rtx-a6000-48gb": Object.freeze({ minVramGb: 48, recommended: false }),
});

function buildWan2gpCloudDeployment({
  provider,
  gpuProfile,
  hourlyGpuUsd,
  endpointUrl = "",
  persistentStorageGb = 60,
  autoStopMinutes = 15,
} = {}) {
  if (!provider) throw new Error("Cloud provider is required.");
  const gpu = SUPPORTED_GPU_PROFILES[gpuProfile];
  if (!gpu) throw new Error("Unsupported GPU profile.");
  if (!Number.isFinite(hourlyGpuUsd) || hourlyGpuUsd < 0) {
    throw new Error("A non-negative hourly GPU price is required.");
  }
  if (!Number.isFinite(persistentStorageGb) || persistentStorageGb < 50) {
    throw new Error("Wan2GP cloud deployment requires at least 50 GB storage.");
  }
  if (!Number.isFinite(autoStopMinutes) || autoStopMinutes < 1) {
    throw new Error("Auto-stop must be at least one minute.");
  }
  let normalizedEndpoint = "";
  if (endpointUrl) {
    let parsed;
    try { parsed = new URL(String(endpointUrl).trim()); }
    catch { throw new Error("Cloud endpoint must be a valid absolute URL."); }
    if (parsed.protocol !== "https:") throw new Error("Cloud endpoint must use HTTPS.");
    if (parsed.username || parsed.password) throw new Error("Cloud endpoint must not embed credentials.");
    normalizedEndpoint = parsed.toString().replace(/\/+$/, "");
  }

  return Object.freeze({
    engine: "Wan2GP",
    provider,
    gpuProfile,
    gpu,
    hourlyGpuUsd,
    endpointUrl: normalizedEndpoint,
    persistentStorageGb,
    autoStopMinutes,
    billingGuard: Object.freeze({
      provisionAutomatically: false,
      paidRunRequiresExplicitApproval: true,
      autoStopRequired: true,
    }),
    connection: Object.freeze({
      protocol: "gradio-http",
      healthPath: "/config",
      studioConfig: "wan2gp.json",
    }),
  });
}

module.exports = { buildWan2gpCloudDeployment, SUPPORTED_GPU_PROFILES };
