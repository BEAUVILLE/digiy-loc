import {assessVoluntaryFeedback} from "./feedback-contract.mjs";

// Server-only receiver. All dependencies are trusted server implementations.
// No public route is installed by importing this module.
const unavailable=()=>({status:503,body:{accepted:false,code:"intake_unavailable"}});
const rejected=()=>({status:400,body:{accepted:false,code:"invalid_feedback"}});
const ok=()=>({status:202,body:{accepted:true,code:"received_for_moderation"}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function receivePrivateFeedback(request,services){
 if(services?.enabled!==true)return unavailable();
 if(!request||request.method!=="POST"||request.contentType!=="application/json"||
    !Number.isInteger(request.bodyBytes)||request.bodyBytes<1||request.bodyBytes>4096)return rejected();
 const assessed=assessVoluntaryFeedback(request.body);
 if(!assessed.accepted||!uuid.test(request.body.listingId))return rejected();
 const required=["checkBot","checkRateLimit","lookupActiveListing","storePrivate"];
 if(required.some(key=>typeof services[key]!=="function"))return unavailable();
 // Trusted adapters must return literal true. Any failure is a closed gate.
 try{
   if(await services.checkBot(request)!==true)return rejected();
   if(await services.checkRateLimit(request)!==true)return rejected();
   if(await services.lookupActiveListing(request.body.listingId)!==true)return rejected();
   const b=request.body;
   const record=Object.freeze({
     listing_id:b.listingId,overall_rating:b.overallRating,
     cleanliness:b.cleanliness??null,comfort:b.comfort??null,welcome:b.welcome??null,
     comment:b.comment,declared_stay:true,publication_consent:b.publicationConsent,
     moderation_status:"received",stay_verified:false
   });
   if(await services.storePrivate(record)!==true)return unavailable();
   return ok();
 }catch{return unavailable();}
}
