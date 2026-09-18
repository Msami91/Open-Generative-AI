const fs = require("fs");
const path = require("path");
const assert = (c, m) => { if (!c) throw new Error(m); };
const source = fs.readFileSync(path.join(__dirname, "..", "..", "packages", "studio", "src", "components", "VideoStudio.jsx"), "utf8");

for (const required of [
  "handleEpisode02DryRun",
  "window.localAI.benchmark.episode02DryRun",
  "result.networkCalls !== 0",
  "result.providerCalls !== 0",
  "E02 Dry Run · 0 cost",
  "typeof window !== \"undefined\"",
]) assert(source.includes(required), `VideoStudio E02 dry-run wiring missing: ${required}`);

const handlerStart = source.indexOf("const handleEpisode02DryRun");
const handlerEnd = source.indexOf("// ── generate", handlerStart);
const handler = source.slice(handlerStart, handlerEnd);
for (const forbidden of ["generateVideo(", "generateI2V(", "processV2V(", "uploadFile("]) {
  assert(!handler.includes(forbidden), `Dry-run handler must not call paid/provider path: ${forbidden}`);
}

console.log("VideoStudio Episode 02 dry-run wiring static audit passed");
