// HTTP-independent boundary: adapter for a trusted Node server.
// The caller must provide a byte-bounded raw body, never a pre-parsed unbounded body.
export function makeTrustHttpBoundary({receive,allowedOrigin,maxBytes=4096}={}){
 if(typeof receive!=="function"||typeof allowedOrigin!=="string"||!/^https:\/\//.test(allowedOrigin))throw Error("configuration_required");
 return async function handle({method,headers={},rawBody}={}){
  const fail=(status,code)=>({status,headers:{"content-type":"application/json","cache-control":"no-store"},body:{accepted:false,code}});
  if(method!=="POST")return fail(405,"method_not_allowed");
  if(headers.origin!==allowedOrigin)return fail(403,"origin_not_allowed");
  if(typeof headers["content-type"]!=="string"||headers["content-type"].toLowerCase()!=="application/json")return fail(415,"unsupported_media_type");
  if(!Buffer.isBuffer(rawBody)||rawBody.length<1||rawBody.length>maxBytes)return fail(413,"invalid_body_size");
  let body;
  try{body=JSON.parse(rawBody.toString("utf8"))}catch{return fail(400,"invalid_json")}
  const response=await receive({method:"POST",contentType:"application/json",bodyBytes:rawBody.length,body});
  return {status:response.status,headers:{"content-type":"application/json","cache-control":"no-store"},body:response.body};
 };
}
