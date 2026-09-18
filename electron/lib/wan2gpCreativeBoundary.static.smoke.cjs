const fs=require("fs"),path=require("path");const assert=(c,m)=>{if(!c)throw new Error(m)};
const p=fs.readFileSync(path.join(__dirname,"wan2gpProvider.js"),"utf8");
const creative=p.indexOf("authorizeCreativeReview({");
const paid=p.indexOf("authorizePaidCloudRun({",creative);
const send=p.indexOf("const send",creative);
assert(creative>=0,"creative guard missing");
assert(paid>creative,"paid authorization must follow creative review");
assert(send>paid,"provider send must occur only after both guards");
console.log("Wan2GP creative-before-provider boundary audit passed");
