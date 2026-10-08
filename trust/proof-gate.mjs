// V6: conservative pure proof gate. Not an attestor; no database, no network, no invitation issuance.
import {assessEvidenceCandidate} from "./evidence-policy.mjs";
const deny=reason=>Object.freeze({decision:"deny",reason,canIssueInvitation:false});
export const PROOF_GATE_VERSION="trust_proof_gate_v6";
export function assessProofGate(candidate,proof,now=new Date()){
 const assessed=assessEvidenceCandidate(candidate,now);
 if(assessed.status==="rejected")return deny(assessed.reason);
 if(!proof||typeof proof!=="object"||Array.isArray(proof))return deny("missing_independent_proof");
 if(proof.sourceModule!==candidate.sourceModule||proof.sourceEventId!==candidate.sourceEventId||proof.clientSubjectId!==candidate.clientSubjectId||proof.professionalId!==candidate.professionalId)return deny("proof_subject_mismatch");
 if(proof.confirmedBy==="owner"||proof.confirmedBy==="professional"||proof.confirmedBy==="driver"||proof.confirmedBy==="browser")return deny("interested_party_confirmation");
 if(proof.confirmedBy!=="independent_server_attestor")return deny("unrecognized_attestor");
 // A caller may forge every field above. Only a backend-bound, audited verification
 // of immutable service events, actor identity, freshness and replay can unlock issuance.
 return deny("trusted_server_verification_not_implemented");
}
