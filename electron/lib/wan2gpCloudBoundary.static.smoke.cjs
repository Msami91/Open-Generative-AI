const fs = require("fs");
const path = require("path");
const vm = require("vm");

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const source = fs.readFileSync(path.join(__dirname, "wan2gpProvider.js"), "utf8");

for (const required of [
  "authorizePaidCloudRun",
  "connectionMode === 'cloud'",
  "paid-run authorization envelope",
  "Cloud uploads are disabled",
  "requireHttps: connectionMode === 'cloud'",
  "fnResolutionCache.clear()",
  "uploadedFiles.clear()",
]) {
  assert(source.includes(required), `Wan2GP provider is missing boundary control: ${required}`);
}

// Syntax-only compile catches malformed CommonJS edits without importing Electron.
new vm.Script(source, { filename: "wan2gpProvider.js" });

for (const file of [
  "cloudCostGuard.js",
  "cloudRunAuthorization.js",
  "wan2gpCloudDeployment.js",
]) {
  const text = fs.readFileSync(path.join(__dirname, file), "utf8");
  new vm.Script(text, { filename: file });
}

console.log("Wan2GP cloud boundary static audit passed");
