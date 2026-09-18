const { ipcMain } = require("electron");
const { createEpisode02DryRun, verifyEpisode02DryRun } = require("./episode02DryRun");

function registerEpisode02DryRun() {
  ipcMain.handle("benchmark:e02:dry-run", (_, input) => {
    const plan = createEpisode02DryRun(input);
    const verification = verifyEpisode02DryRun(plan);
    return {
      dryRun: true,
      networkCalls: 0,
      providerCalls: 0,
      benchmark: plan.benchmark,
      generationFingerprint: plan.generationFingerprint,
      costEstimate: plan.costEstimate,
      costFingerprint: plan.costFingerprint,
      cloudRunFingerprint: plan.cloudRunFingerprint,
      providerPayload: plan.providerPayload,
      verification,
    };
  });
}

module.exports = { registerEpisode02DryRun };
