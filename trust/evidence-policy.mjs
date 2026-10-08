import {MODULES} from "./module-registry.mjs";
export const PILOT_MODULES=Object.freeze(["loc","resto","driver"]);
const reject=reason=>({status:"rejected",reason,canIssueInvitation:false});
export function assessEvidenceCandidate(input,now=new Date()){
 if(!input||typeof input!=="object"||Array.isArray(input))return reject("invalid_candidate");
 if(!Object.hasOwn(MODULES,input.sourceModule))return reject("unknown_module");
 if(!PILOT_MODULES.includes(input.sourceModule))return reject("module_not_piloted");
 for(const key of ["sourceEventId","professionalId","clientSubjectId"]){
   if(typeof input[key]!=="string"||!/^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,127}$/.test(input[key]))return reject("invalid_"+key);
 }
 if(input.professionalId===input.clientSubjectId)return reject("self_review");
 if(input.status!=="completed")return reject("not_completed");
 const completed=typeof input.completedAt==="string"?new Date(input.completedAt):new Date(NaN);
 if(!(now instanceof Date)||!Number.isFinite(now.getTime())||!Number.isFinite(completed.getTime())||completed>now)return reject("invalid_completion");
 if(typeof input.evidenceSource!=="string"||!input.evidenceSource||["owner","professional","browser","client_form","public_api"].includes(input.evidenceSource))return reject("untrusted_source");
 if(typeof input.proofReference!=="string"||!/^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,127}$/.test(input.proofReference))return reject("missing_proof_reference");
 // A claimed source and reference are untrusted. A separately audited server attestor is mandatory.
 return {status:"requires_independent_attestor",reason:"independent_verification_required",canIssueInvitation:false};
}
