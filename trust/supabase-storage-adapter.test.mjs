import test from "node:test";
import assert from "node:assert/strict";
import {makePrivateFeedbackStorage} from "./supabase-storage-adapter.mjs";
const id="c3a48bfa-9d2e-4f0a-8b1e-84989a9b4f7a";
const record={listing_id:id,overall_rating:5,cleanliness:null,comfort:null,welcome:null,comment:"OK",declared_stay:true,publication_consent:false,moderation_status:"received",stay_verified:false};
test("lookup checks active unit by bound UUID",async()=>{let args;const db={query:async(...x)=>{args=x;return {rows:[{one:1}]}}};assert.equal(await makePrivateFeedbackStorage(db).lookupActiveListing(id),true);assert.deepEqual(args[1],[id]);assert.match(args[0],/is_active=true/)});
test("invalid lookup never queries",async()=>{let calls=0;const s=makePrivateFeedbackStorage({query:async()=>{calls++}});assert.equal(await s.lookupActiveListing("bad"),false);assert.equal(calls,0)});
test("write uses parameter binding and private schema",async()=>{let args;const db={query:async(...x)=>{args=x;return {rowCount:1}}};assert.equal(await makePrivateFeedbackStorage(db).storePrivate(record),true);assert.match(args[0],/digiy_trust_private\.voluntary_feedback/);assert.match(args[0],/is_active=true/);assert.deepEqual(args[1],[id,5,null,null,null,"OK",false])});
test("owner cannot set verification flag",async()=>{let calls=0;const s=makePrivateFeedbackStorage({query:async()=>{calls++}});assert.equal(await s.storePrivate({...record,stay_verified:true}),false);assert.equal(calls,0)});
test("no inserted row means false",async()=>{const s=makePrivateFeedbackStorage({query:async()=>({rowCount:0})});assert.equal(await s.storePrivate(record),false)});
test("injection is never interpolated",async()=>{let calls=0;const s=makePrivateFeedbackStorage({query:async()=>{calls++}});assert.equal(await s.storePrivate({...record,listing_id:"x';drop table y;--"}),false);assert.equal(calls,0)});

test("INSERT has no RETURNING and succeeds with rowCount 1",async()=>{let sql;const s=makePrivateFeedbackStorage({query:async x=>{sql=x;return {rowCount:1,rows:[]}}});assert.equal(await s.storePrivate(record),true);assert.doesNotMatch(sql,/\breturning\b/i)});
test("write fails closed if rowCount is absent",async()=>{const s=makePrivateFeedbackStorage({query:async()=>({rows:[{id:"untrusted"}]})});assert.equal(await s.storePrivate(record),false)});
