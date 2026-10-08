import test from "node:test";
import assert from "node:assert/strict";
import {assessPrivateIntake} from "./private-intake-boundary.mjs";
const body={contractVersion:"trust_feedback_v12",listingId:"loc_123",overallRating:4,comment:"OK",stayedHere:true,publicationConsent:false};
const request={method:"POST",contentType:"application/json",bodyBytes:300,body};
const policy={enabled:true,rateLimitPassed:true,botCheckPassed:true,listingExists:true,privateStorageReady:true};
for(const [name,r,p,reason] of [
 ["disabled",request,{...policy,enabled:false},"intake_disabled"],
 ["no policy",request,null,"intake_disabled"],
 ["invalid request",null,policy,"invalid_request"],
 ["oversize",{...request,bodyBytes:4097},policy,"invalid_body_size"],
 ["wrong method",{...request,method:"GET"},policy,"method_not_allowed"],
 ["wrong content type",{...request,contentType:"text/plain"},policy,"invalid_content_type"],
 ["rate limit missing",request,{...policy,rateLimitPassed:false},"rate_limit_not_verified"],
 ["bot check missing",request,{...policy,botCheckPassed:false},"bot_check_not_verified"],
 ["unknown listing",request,{...policy,listingExists:false},"listing_not_verified"],
 ["private storage unavailable",request,{...policy,privateStorageReady:false},"private_storage_unavailable"],
 ["forged verified stay",{...request,body:{...body,verifiedStay:true}},policy,"unexpected_fields"],
 ["all green still closed",request,policy,"server_intake_not_implemented"],
])test(name,()=>{const out=assessPrivateIntake(r,p);assert.equal(out.reason,reason);assert.equal(out.decision,"deny");assert.equal(out.mayStore,false);assert.equal(out.mayPublish,false);assert.equal(out.verifiedStay,false)});
