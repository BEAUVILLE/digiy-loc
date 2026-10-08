// DIGIY TRUST V3 — server attestor contract, intentionally fail closed.
// This is NOT a verifier. Only an independently authenticated backend may implement one.
export const ATTESTATION_VERSION="trust_attestation_v3";
export const ATTESTATION_DECISION=Object.freeze({DENY:"deny",REQUIRES_VERIFIER:"requires_verifier"});
const deny=reason=>Object.freeze({decision:ATTESTATION_DECISION.DENY,reason,canIssueInvitation:false});
export function validateAttestationRequest(request){
  if(!request||typeof request!=="object"||Array.isArray(request))return deny("invalid_request");
  if(!["loc","resto","driver"].includes(request.sourceModule))return deny("unsupported_module");
  if(request.claimedBy==="owner"||request.claimedBy==="professional"||request.claimedBy==="browser")return deny("untrusted_claimant");
  if(request.status!=="completed")return deny("not_completed");
  if(typeof request.sourceEventId!=="string"||!request.sourceEventId.trim())return deny("missing_event");
  if(typeof request.professionalId!=="string"||!request.professionalId.trim())return deny("missing_professional");
  if(typeof request.clientSubjectId!=="string"||!request.clientSubjectId.trim())return deny("missing_client");
  if(request.professionalId===request.clientSubjectId)return deny("self_review");
  // A user-supplied verifierId, signature or 'verified' flag is not a trusted verifier.
  return Object.freeze({decision:ATTESTATION_DECISION.REQUIRES_VERIFIER,reason:"backend_identity_and_service_proof_required",canIssueInvitation:false});
}
// Never promote caller-provided flags to verified status.
export function issueInvitationFromUnverifiedRequest(_request){return deny("server_attestor_not_implemented");}
