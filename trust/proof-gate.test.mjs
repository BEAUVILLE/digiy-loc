import test from "node:test";
import assert from "node:assert/strict";
import {assessProofGate} from "./proof-gate.mjs";
const candidate={sourceModule:"loc",sourceEventId:"stay_123",professionalId:"pro_123",clientSubjectId:"client_456",status:"completed",completedAt:"2026-10-01T12:00:00Z",evidenceSource:"server_event",proofReference:"proof_123"};
const now=new Date("2026-10-08T12:00:00Z");
const proof={sourceModule:"loc",sourceEventId:"stay_123",professionalId:"pro_123",clientSubjectId:"client_456",confirmedBy:"independent_server_attestor"};
for(const [name,c,p,reason] of [
 ["missing proof",candidate,null,"missing_independent_proof"],
 ["different event",candidate,{...proof,sourceEventId:"stay_999"},"proof_subject_mismatch"],
 ["different client",candidate,{...proof,clientSubjectId:"client_999"},"proof_subject_mismatch"],
 ["owner confirmation",candidate,{...proof,confirmedBy:"owner"},"interested_party_confirmation"],
 ["forged attestor",candidate,proof,"trusted_server_verification_not_implemented"],
 ["self review",{...candidate,clientSubjectId:"pro_123"},proof,"self_review"],
 ["uncompleted",{...candidate,status:"pending"},proof,"not_completed"],
 ["unknown module",{...candidate,sourceModule:"unknown"},proof,"unknown_module"]
])test(name,()=>{const result=assessProofGate(c,p,now);assert.equal(result.decision,"deny");assert.equal(result.reason,reason);assert.equal(result.canIssueInvitation,false)});
