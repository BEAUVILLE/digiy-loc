import {assessPrivateIntake} from "./private-intake-boundary.mjs";
// Adapter for a future server-side handler. Never expose this directly as a public route.
const denied=(reason)=>Object.freeze({status:503,body:{accepted:false,code:"intake_unavailable"},internalReason:reason});
export async function handlePrivateFeedback(request,services){
 if(!services||services.enabled!==true)return denied("disabled");
 if(!services.validateBot||!services.enforceRateLimit||!services.resolveListing||!services.storePrivate)return denied("missing_trusted_dependencies");
 // Fail closed: no private storage write in this version.
 return denied("storage_write_not_authorized");
}
