export const FEEDBACK_CONTRACT_VERSION="trust_feedback_v12";
const deny=(reason)=>Object.freeze({accepted:false,reason,publish:false,verifiedStay:false});
const allowedKeys=new Set(["contractVersion","listingId","overallRating","cleanliness","comfort","welcome","comment","stayedHere","publicationConsent"]);
const id=x=>typeof x==="string"&&/^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,127}$/.test(x);
const score=x=>Number.isInteger(x)&&x>=1&&x<=5;
export function assessVoluntaryFeedback(input){
 if(!input||typeof input!=="object"||Array.isArray(input))return deny("invalid_input");
 if(Object.keys(input).some(k=>!allowedKeys.has(k)))return deny("unexpected_fields");
 if(input.contractVersion!==FEEDBACK_CONTRACT_VERSION)return deny("invalid_version");
 if(!id(input.listingId))return deny("invalid_listing");
 if(!score(input.overallRating))return deny("invalid_rating");
 for(const key of ["cleanliness","comfort","welcome"])if(input[key]!==undefined&&input[key]!==null&&!score(input[key]))return deny("invalid_"+key);
 if(typeof input.comment!=="string"||input.comment.length>1500)return deny("invalid_comment");
 if(input.stayedHere!==true)return deny("stay_not_declared");
 if(typeof input.publicationConsent!=="boolean")return deny("invalid_consent");
 return Object.freeze({accepted:true,reason:"eligible_for_private_intake_only",publish:false,verifiedStay:false});
}
