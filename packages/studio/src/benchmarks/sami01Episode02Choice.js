// Cloud benchmark configuration for SAMI-01 Season 01.
// This file is deliberately provider-neutral and performs no network or paid action.

export const EPISODE_02_CHOICE_BENCHMARK = Object.freeze({
  id: "sami-01-s01-e02-choice",
  title: "CHOICE",
  identityId: "SAMI-01",
  operation: "image-to-video",
  target: Object.freeze({
    aspectRatio: "9:16",
    durationSeconds: 8,
    resolution: "720p",
    fps: 24,
  }),
  qualityBar: Object.freeze({
    referenceEpisode: "S01E01-CONTROL",
    identityConsistency: "required",
    photorealisticSkin: "required",
    stableHandsAndAnatomy: "required",
    coherentCameraMotion: "required",
    noAiGloss: true,
  }),
  prompt: [
    "Cinematic photorealistic vertical short film.",
    "The same adult male identity appears as two versions of himself at one decision point.",
    "Both versions must preserve exactly the same face, facial geometry, hairline, beard, skin tone, and body proportions.",
    "Wardrobe is designed for this scene and must not be copied from identity reference photographs.",
    "The two versions make different choices and move toward different paths.",
    "Premium restrained lighting, realistic skin texture, natural body motion, shallow depth of field, controlled camera movement.",
    "No text, no subtitles, no logos, no motivational quote, no beauty filter, no plastic skin.",
  ].join(" "),
  acceptance: Object.freeze({
    identityDrift: "reject",
    duplicatedOrMalformedBodyParts: "reject",
    faceMorphing: "reject",
    wardrobeCopiedFromIdentityReference: "reject",
    unexplainedText: "reject",
  }),
});

export function buildCloudBenchmarkPlan({
  provider,
  model,
  hourlyGpuUsd,
  estimatedRuntimeMinutes,
  storageUsd = 0,
} = {}) {
  if (!provider || !model) throw new Error("Provider and model are required.");
  if (!Number.isFinite(hourlyGpuUsd) || hourlyGpuUsd < 0) {
    throw new Error("A non-negative hourly GPU price is required.");
  }
  if (!Number.isFinite(estimatedRuntimeMinutes) || estimatedRuntimeMinutes <= 0) {
    throw new Error("A positive estimated runtime is required.");
  }

  const computeUsd = hourlyGpuUsd * (estimatedRuntimeMinutes / 60);
  const estimatedTotalUsd = computeUsd + storageUsd;

  return Object.freeze({
    benchmark: EPISODE_02_CHOICE_BENCHMARK,
    provider,
    model,
    estimate: Object.freeze({
      hourlyGpuUsd,
      estimatedRuntimeMinutes,
      computeUsd,
      storageUsd,
      estimatedTotalUsd,
    }),
    requiresExplicitPaidRunApproval: true,
  });
}
