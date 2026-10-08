import test from "node:test";
import assert from "node:assert/strict";
import {assessAttestationEnvelope,ATTESTATION_PROTOCOL_VERSION} from "./attestation-protocol.mjs";
const now=new Date("2026-10-08T12:00:00Z");
const candidate={sourceModule:"loc",sourceEventId:"stay_123",professionalId:"pro_123",clientSubjectId:"client_456",status:"completed",completedAt:"2026-10-01T12:00:00Z",evidenceSource:"server_event",proofReference:"proof_123"};
const proof={sourceModule:"loc",sourceEventId:"stay_123",professionalId:"pro_123",clientSubjectId:"client_456",confirmedBy:"independent_server_attestor",protocolVersion:ATTESTATION_PROTOCOL_VERSION,attestationId:"att_123",reservationId:"res_123",serviceEventId:"stay_123",actorId:"actor_456",evidenceDigest:"digest_123",attestedAt:"2026-10-08T11:00:00Z",evidenceRefs:["event_1","event_2"]};
for(const [name,c,p,reason] of [
 ["missing proof",candidate,null,"missing_independent_proof"],
 ["owner confirmation",candidate,{...proof,confirmedBy:"owner"},"interested_party_confirmation"],
 ["forged fully populated envelope",candidate,proof,"trusted_server_verification_not_implemented"],
 ["version mismatch",candidate,{...proof,protocolVersion:"v0"},"protocol_version_mismatch"],
 ["missing reservation",candidate,{...proof,reservationId:""},"invalid_reservationId"],
 ["wrong service event",candidate,{...proof,serviceEventId:"stay_999"},"event_mismatch"],
 ["interested actor",candidate,{...proof,actorId:"pro_123"},"interested_actor"],
 ["future timestamp",candidate,{...proof,attestedAt:"2027-01-01T00:00:00Z"},"invalid_attestation_time"],
 ["duplicate evidence refs",candidate,{...proof,evidenceRefs:["event_1","event_1"]},"invalid_evidence_refs"],
 ["only one evidence ref",candidate,{...proof,evidenceRefs:["event_1"]},"invalid_evidence_refs"],
 ["self review",{...candidate,clientSubjectId:"pro_123"},proof,"self_review"],
 ["not completed",{...candidate,status:"pending"},proof,"not_completed"],
])test(name,()=>{const r=assessAttestationEnvelope(c,p,now);assert.equal(r.decision,"deny");assert.equal(r.reason,reason);assert.equal(r.canIssueInvitation,false)});
