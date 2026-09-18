const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = (c, m) => { if (!c) throw new Error(m); };

for (const file of [
  "episode02DryRun.js",
  "episode02DryRunIpc.js",
  "cloudCostGuard.js",
  "cloudRunAuthorization.js",
  "wan2gpCloudDeployment.js",
  "wan2gpProvider.js",
]) {
  new vm.Script(fs.readFileSync(path.join(__dirname, file), "utf8"), { filename: file });
}

const main = fs.readFileSync(path.join(__dirname, "..", "main.js"), "utf8");
const preload = fs.readFileSync(path.join(__dirname, "..", "preload.js"), "utf8");
assert(main.includes("registerEpisode02DryRun()"), "Main process must register Episode 02 dry-run IPC.");
assert(preload.includes("benchmark:e02:dry-run"), "Preload must expose Episode 02 dry-run IPC.");
assert(!fs.readFileSync(path.join(__dirname, "episode02DryRun.js"), "utf8").includes("http.request("), "Dry-run planner must not perform HTTP.");
assert(!fs.readFileSync(path.join(__dirname, "episode02DryRun.js"), "utf8").includes("https.request("), "Dry-run planner must not perform HTTPS.");

console.log("Episode 02 IPC dry-run static audit passed");
