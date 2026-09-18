const { createCreativeReviewFingerprint, authorizeCreativeReview } = require("./creativeReviewGuard");
const assert = (c,m) => { if(!c) throw new Error(m); };
const base = {
  episodeId: "sami-01-s01-e02-choice",
  storyboard: { version: 1, beats: ["decision point","two paths","split outcome"], textOverlay: false },
  musicPlan: { continuityReference: "S01E01-CONTROL", finalMasterReservedFor: "S01E06-ONE" },
};
const fp=createCreativeReviewFingerprint(base);
assert(authorizeCreativeReview({...base,approved:true,approvedCreativeFingerprint:fp}).approved,"exact creative review must pass");
for(const mutation of [
  {storyboard:{...base.storyboard,version:2}},
  {musicPlan:{...base.musicPlan,continuityReference:"other"}},
  {episodeId:"sami-01-s01-e03-consequence"},
]){
 let blocked=false;try{authorizeCreativeReview({...base,...mutation,approved:true,approvedCreativeFingerprint:fp});}catch{blocked=true}
 assert(blocked,"creative mutation must invalidate approval");
}
let blocked=false;try{authorizeCreativeReview({...base,approved:false,approvedCreativeFingerprint:fp});}catch{blocked=true}
assert(blocked,"missing explicit creative approval must block");
console.log("creative review guard smoke tests passed");
