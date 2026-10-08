// V4: non-operational module adapters. No network, database or invitation issuance.
import {assessEvidenceCandidate} from "./evidence-policy.mjs";
const reject=(reason)=>Object.freeze({eligible:false,reason,canIssueInvitation:false});
const sourceFields=Object.freeze({
 loc:Object.freeze({reference:"loc_reservation_requests",proof:"independent_stay_confirmation_required"}),
 resto:Object.freeze({reference:"digiy_resa_resto_bookings",proof:"independent_meal_confirmation_required"}),
 driver:Object.freeze({reference:"driver_direct_contact",proof:"independent_trip_confirmation_required"})
});
export function attestorReadiness(module){
 if(!Object.hasOwn(sourceFields,module))return reject("unsupported_module");
 return Object.freeze({eligible:false,canIssueInvitation:false,source:sourceFields[module].reference,blocker:sourceFields[module].proof});
}
export function evaluateModuleCandidate(module,candidate,now=new Date()){
 if(!Object.hasOwn(sourceFields,module))return reject("unsupported_module");
 if(!candidate||candidate.sourceModule!==module)return reject("module_mismatch");
 const assessment=assessEvidenceCandidate(candidate,now);
 if(assessment.status==="rejected")return reject(assessment.reason);
 // Never accept caller-supplied verifiedByServer, signature or completed status as proof.
 return reject("independent_attestor_not_connected");
}
