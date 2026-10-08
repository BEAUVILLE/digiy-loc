import test from "node:test";
import assert from "node:assert/strict";
import {createTrustPilot} from "./integration-pilot.mjs";
const listingId="c3a48bfa-9d2e-4f0a-8b1e-84989a9b4f7a";
const request={method:"POST",contentType:"application/json",bodyBytes:220,body:{contractVersion:"trust_feedback_v12",listingId,overallRating:4,comment:"Bien",stayedHere:true,publicationConsent:false}};
function mock(){const calls=[];return {calls,db:{query:async(sql,values)=>{calls.push({sql,values});return sql.trimStart().toLowerCase().startsWith("insert")?{rowCount:1,rows:[]}:{rows:[{id:"ok"}]}}}};}
test("pilot disabled by default",async()=>{const x=mock();const fn=createTrustPilot({db:x.db,verifyBot:async()=>true,consumeQuota:async()=>true});assert.equal((await fn(request)).status,503);assert.equal(x.calls.length,0)});
test("enabled pilot uses private insert",async()=>{const x=mock();const fn=createTrustPilot({db:x.db,enabled:true,verifyBot:async()=>true,consumeQuota:async()=>true});assert.equal((await fn(request)).status,202);assert.equal(x.calls.length,2);assert.match(x.calls[1].sql,/digiy_trust_private/);assert.equal(x.calls[1].values.at(-1),false)});
test("bot rejection blocks database",async()=>{const x=mock();const fn=createTrustPilot({db:x.db,enabled:true,verifyBot:async()=>false,consumeQuota:async()=>true});assert.equal((await fn(request)).status,400);assert.equal(x.calls.length,0)});
test("quota rejection blocks database",async()=>{const x=mock();const fn=createTrustPilot({db:x.db,enabled:true,verifyBot:async()=>true,consumeQuota:async()=>false});assert.equal((await fn(request)).status,400);assert.equal(x.calls.length,0)});
test("security adapters required",()=>{const x=mock();assert.throws(()=>createTrustPilot({db:x.db}),/security_adapters_required/)});
test("database errors are private",async()=>{const fn=createTrustPilot({db:{query:async()=>{throw Error("secret")}},enabled:true,verifyBot:async()=>true,consumeQuota:async()=>true});const result=await fn(request);assert.equal(result.status,503);assert.equal(JSON.stringify(result).includes("secret"),false)});
