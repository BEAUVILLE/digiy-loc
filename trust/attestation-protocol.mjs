// V9: untrusted attestation envelope validation only. NOT an attestor or authorization.
import {assessProofGate} from "./proof-gate.mjs";
export const ATTESTATION_PROTOCOL_VERSION="trust_attestation_v9";
const deny=reason=>Object.freeze({decision:"deny",reason,canIssueInvitation:false});
const token=x=>typeof x==="string"&&/^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,127}$/.test(x);
export function assessAttestationEnvelope(candidate,envelope,now=new Date()){
 const baseline=assessProofGate(candidate,envelope,now);
 if(baseline.reason!=="trusted_server_verification_not_implemented")return baseline;
 if(!envelope||typeof envelope!=="object"||Array.isArray(envelope))return deny("invalid_envelope");
 if(envelope.protocolVersion!==ATTESTATION_PROTOCOL_VERSION)return deny("protocol_version_mismatch");
 for(const field of ["attestationId","reservationId","serviceEventId","actorId","evidenceDigest"]){
   if(!token(envelope[field]))return deny("invalid_"+field);
 }
 if(envelope.serviceEventId!==candidate.sourceEventId)return deny("event_mismatch");
 if(envelope.actorId===candidate.professionalId)return deny("interested_actor");
 const created=typeof envelope.attestedAt==="string"?new Date(envelope.attestedAt):new Date(NaN);
 if(!(now instanceof Date)||!Number.isFinite(now.getTime())||!Number.isFinite(created.getTime())||created>now)return deny("invalid_attestation_time");
 if(!Array.isArray(envelope.evidenceRefs)||envelope.evidenceRefs.length<2||envelope.evidenceRefs.length>8||!envelope.evidenceRefs.every(token)||new Set(envelope.evidenceRefs).size!==envelope.evidenceRefs.length)return deny("invalid_evidence_refs");
 // Everything in an envelope is caller-controlled: an apparently valid envelope
 // cannot establish authentic actor identity, provenance, immutable event or non-replay.
 return deny("trusted_server_verification_not_implemented");
}
