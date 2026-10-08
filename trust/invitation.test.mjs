import test from "node:test";
import assert from "node:assert/strict";
import {issueInvitation,verifyInvitation,hashToken} from "./invitation.mjs";
const now=new Date("2026-10-08T12:00:00Z");
test("eligible client gets unpredictable one-use invitation representation",()=>{
 const invite=issueInvitation({verifiedEligibility:{ok:true},now});
 assert.match(invite.token,/^[a-f0-9]{64}$/);
 assert.notEqual(invite.token,invite.tokenHash);
 assert.equal(hashToken(invite.token),invite.tokenHash);
 assert.equal(verifyInvitation({token:invite.token,storedHash:invite.tokenHash,expiresAt:invite.expiresAt,now}).ok,true);
});
test("ineligible client gets no invitation",()=>assert.throws(()=>issueInvitation({verifiedEligibility:{ok:false},now}),/not_eligible/));
test("expired invitation rejected",()=>{const i=issueInvitation({verifiedEligibility:{ok:true},now,ttlMs:1000});assert.equal(verifyInvitation({token:i.token,storedHash:i.tokenHash,expiresAt:i.expiresAt,now:new Date(now.getTime()+1000)}).reason,"expired")});
test("consumed invitation rejected",()=>{const i=issueInvitation({verifiedEligibility:{ok:true},now});assert.equal(verifyInvitation({token:i.token,storedHash:i.tokenHash,expiresAt:i.expiresAt,consumedAt:now.toISOString(),now}).reason,"unavailable")});
test("wrong token rejected",()=>{const i=issueInvitation({verifiedEligibility:{ok:true},now});assert.equal(verifyInvitation({token:"0".repeat(64),storedHash:i.tokenHash,expiresAt:i.expiresAt,now}).ok,false)});
test("invalid token rejected",()=>{const i=issueInvitation({verifiedEligibility:{ok:true},now});assert.equal(verifyInvitation({token:"hello",storedHash:i.tokenHash,expiresAt:i.expiresAt,now}).ok,false)});
test("oversized lifetime refused",()=>assert.throws(()=>issueInvitation({verifiedEligibility:{ok:true},now,ttlMs:8*86400000}),/invalid_expiry/));
