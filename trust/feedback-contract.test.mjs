import test from "node:test";
import assert from "node:assert/strict";
import {assessVoluntaryFeedback,FEEDBACK_CONTRACT_VERSION} from "./feedback-contract.mjs";
const valid={contractVersion:FEEDBACK_CONTRACT_VERSION,listingId:"loc_123",overallRating:4,comment:"Séjour agréable",stayedHere:true,publicationConsent:false};
test("valid voluntary feedback stays private and unverified",()=>assert.deepEqual(assessVoluntaryFeedback(valid),{accepted:true,reason:"eligible_for_private_intake_only",publish:false,verifiedStay:false}));
for(const [name,input,reason] of [
 ["missing",null,"invalid_input"],
 ["wrong version",{...valid,contractVersion:"v0"},"invalid_version"],
 ["bad listing",{...valid,listingId:"../a"},"invalid_listing"],
 ["bad rating",{...valid,overallRating:6},"invalid_rating"],
 ["noninteger rating",{...valid,overallRating:4.5},"invalid_rating"],
 ["bad optional score",{...valid,comfort:0},"invalid_comfort"],
 ["long comment",{...valid,comment:"x".repeat(1501)},"invalid_comment"],
 ["no stay",{...valid,stayedHere:false},"stay_not_declared"],
 ["missing consent",{...valid,publicationConsent:undefined},"invalid_consent"],
 ["extra contact data",{...valid,phone:"770000000"},"unexpected_fields"],
 ["injected state",{...valid,verifiedStay:true},"unexpected_fields"],
])test(name,()=>{const r=assessVoluntaryFeedback(input);assert.equal(r.accepted,false);assert.equal(r.reason,reason);assert.equal(r.publish,false);assert.equal(r.verifiedStay,false)});
