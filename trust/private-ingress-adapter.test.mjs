import test from "node:test";
import assert from "node:assert/strict";
import {handlePrivateFeedback} from "./private-ingress-adapter.mjs";
const request={method:"POST",contentType:"application/json",bodyBytes:200,body:{contractVersion:"trust_feedback_v12",listingId:"abc",overallRating:5,comment:"OK",stayedHere:true,publicationConsent:false}};
test("disabled without services",async()=>assert.equal((await handlePrivateFeedback(request)).status,503));
test("missing dependencies denied",async()=>assert.equal((await handlePrivateFeedback(request,{enabled:true})).status,503));
test("no write even when all dependencies supplied",async()=>{
 let writes=0;const services={enabled:true,validateBot:async()=>true,enforceRateLimit:async()=>true,resolveListing:async()=>true,storePrivate:async()=>{writes++}};
 const out=await handlePrivateFeedback(request,services);
 assert.equal(out.status,503);assert.equal(writes,0);assert.equal(out.body.accepted,false);
});
