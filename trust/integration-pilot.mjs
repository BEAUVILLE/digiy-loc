// Private server-only wiring. No endpoint or DB connection is created here.
import {receivePrivateFeedback} from "./private-receiver.mjs";
import {makePrivateFeedbackStorage} from "./supabase-storage-adapter.mjs";
export function createTrustPilot({db,verifyBot,consumeQuota,enabled=false}={}){
 if(!db||typeof db.query!=="function")throw Error("trusted_db_required");
 if(typeof verifyBot!=="function"||typeof consumeQuota!=="function")throw Error("security_adapters_required");
 const storage=makePrivateFeedbackStorage(db);
 return async function receive(request){
   return receivePrivateFeedback(request,{
     enabled,
     checkBot:verifyBot,
     checkRateLimit:consumeQuota,
     lookupActiveListing:storage.lookupActiveListing,
     storePrivate:storage.storePrivate
   });
 };
}
