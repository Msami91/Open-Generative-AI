const { createEpisode02DryRun, verifyEpisode02DryRun } = require("./episode02DryRun");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const base = {
  identityReferenceIds: ["sami-passport", "sami-mirror-01"],
  prompt: "Two versions of the same locked SAMI-01 identity reach one decision point and choose different paths. No text.",
  provider: "dry-run-cloud",
  endpointUrl: "https://example.invalid",
  hourlyGpuUsd: 0.99,
  runtimeMinutes: 15,
  startupMinutes: 5,
};

const plan = createEpisode02DryRun(base);
assert(plan.dryRun === true, "Plan must remain dry-run.");
assert(plan.networkCalls === 0 && plan.providerCalls === 0, "Dry-run must make zero external calls.");
assert(verifyEpisode02DryRun(plan).canRun === true, "Exact dry-run envelope must verify.");

const promptMutation = createEpisode02DryRun({ ...base, prompt: base.prompt + " Camera pans left." });
assert(promptMutation.generationFingerprint !== plan.generationFingerprint, "Prompt change must alter generation fingerprint.");
assert(promptMutation.cloudRunFingerprint !== plan.cloudRunFingerprint, "Prompt change must alter cloud-run fingerprint.");

const priceMutation = createEpisode02DryRun({ ...base, hourlyGpuUsd: 1.09 });
assert(priceMutation.costFingerprint !== plan.costFingerprint, "Price change must alter cost fingerprint.");
assert(priceMutation.cloudRunFingerprint !== plan.cloudRunFingerprint, "Price change must alter cloud-run fingerprint.");

const refMutation = createEpisode02DryRun({ ...base, identityReferenceIds: ["sami-passport"] });
assert(refMutation.generationFingerprint !== plan.generationFingerprint, "Reference change must alter generation fingerprint.");

for (const mutation of [
  { endpointUrl: "http://example.invalid" },
  { endpointUrl: "https://user:pass@example.invalid" },
  { identityReferenceIds: [] },
  { prompt: " " },
]) {
  let blocked = false;
  try { createEpisode02DryRun({ ...base, ...mutation }); } catch { blocked = true; }
  assert(blocked, `Unsafe dry-run input was not blocked: ${JSON.stringify(mutation)}`);
}

console.log("Episode 02 zero-network E2E dry-run smoke tests passed");
