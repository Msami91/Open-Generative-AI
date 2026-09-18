const {validateStoryboardIdentity}=require("./storyboardIdentityGuard");
const assert=(c,m)=>{if(!c)throw new Error(m)};
const storyboard={episode:"CHOICE",shots:[1,2,3]};
const good={id:"passport-real",identityId:"SAMI-01",approved:true,sourceType:"real-photo"};
assert(validateStoryboardIdentity({identityId:"SAMI-01",references:[good],storyboard}).wardrobeIndependent,"real approved photo must pass");
for(const bad of [
 {...good,approved:false},
 {...good,sourceType:"generated"},
 {...good,sourceType:"scene"},
 {...good,identityId:"OTHER"},
]){
 let blocked=false;try{validateStoryboardIdentity({identityId:"SAMI-01",references:[bad],storyboard})}catch{blocked=true}
 assert(blocked,"unsafe identity source must be blocked");
}
console.log("storyboard identity guard smoke tests passed");
