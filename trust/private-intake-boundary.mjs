// Pure intake decision, no network, storage, public endpoint or attestation.
import {assessVoluntaryFeedback} from "./feedback-contract.mjs";
export const PRIVATE_INTAKE_VERSION="trust_private_intake_v13";
const deny=(reason)=>Object.freeze({decision:"deny",reason,mayStore:false,mayPublish:false,verifiedStay:false});
export function assessPrivateIntake(request,policy){
 if(!policy||policy.enabled!==true)return deny("intake_disabled");
 if(!request||typeof request!=="object"||Array.isArray(request))return deny("invalid_request");
 if(!Number.isInteger(request.bodyBytes)||request.bodyBytes<0||request.bodyBytes>4096)return deny("invalid_body_size");
 if(request.method!=="POST")return deny("method_not_allowed");
 if(request.contentType!=="application/json")return deny("invalid_content_type");
 if(policy.rateLimitPassed!==true)return deny("rate_limit_not_verified");
 if(policy.botCheckPassed!==true)return deny("bot_check_not_verified");
 if(policy.listingExists!==true)return deny("listing_not_verified");
 if(policy.privateStorageReady!==true)return deny("private_storage_unavailable");
 const assessed=assessVoluntaryFeedback(request.body);
 if(!assessed.accepted)return deny(assessed.reason);
 // Validation is not permission to persist: service implementation must enforce
 // access controls and atomic write independently. This remains fail-closed.
 return deny("server_intake_not_implemented");
}
