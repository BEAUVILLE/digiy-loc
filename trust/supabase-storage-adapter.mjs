// Trusted server-side storage adapter for DIGIY TRUST V16.
// db is an injected privileged Postgres connection (never a browser client).
// Expected db.query(text, values) with parameter binding, e.g. node-postgres Pool.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const rating=x=>x===null||(Number.isInteger(x)&&x>=1&&x<=5);
export function makePrivateFeedbackStorage(db){
 if(!db||typeof db.query!=="function")throw Error("trusted_db_required");
 return Object.freeze({
   async lookupActiveListing(id){
     if(typeof id!=="string"||!uuid.test(id))return false;
     const res=await db.query("select 1 from public.digiy_loc_master_units where id=$1::uuid and is_active=true limit 1",[id]);
     return res?.rows?.length===1;
   },
   async storePrivate(record){
     if(!record||typeof record!=="object"||!uuid.test(record.listing_id)||
       !Number.isInteger(record.overall_rating)||record.overall_rating<1||record.overall_rating>5||
       !["cleanliness","comfort","welcome"].every(k=>rating(record[k]))||
       typeof record.comment!=="string"||record.comment.length>1500||
       record.declared_stay!==true||typeof record.publication_consent!=="boolean"||
       record.moderation_status!=="received"||record.stay_verified!==false)return false;
     const sql=`insert into digiy_trust_private.voluntary_feedback
       (listing_id,overall_rating,cleanliness,comfort,welcome,comment,declared_stay,publication_consent,moderation_status,stay_verified)
       select u.id,$2,$3,$4,$5,$6,true,$7,'received',false
       from public.digiy_loc_master_units u where u.id=$1::uuid and u.is_active=true
       `;
     const values=[record.listing_id,record.overall_rating,record.cleanliness,record.comfort,record.welcome,record.comment,record.publication_consent];
     const res=await db.query(sql,values);
     return res?.rowCount===1;
   }
 });
}
