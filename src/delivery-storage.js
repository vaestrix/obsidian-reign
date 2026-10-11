// Read-only verification against an explicitly configured private Cloudflare R2 bucket.
// Never use public URLs or trust client-provided MIME/size without comparing storage metadata.
export async function verifyDeliveryFiles(bucket,manifest){
 if(!bucket||typeof bucket.head!=='function')return {verified:false,reason:'storage_not_configured'};
 if(!manifest||!Array.isArray(manifest.files)||manifest.files.length===0)return {verified:false,reason:'invalid_manifest'};
 const checked=[];
 for(const file of manifest.files){
  if(typeof file.storageKey!=='string'||!file.storageKey.startsWith('deliveries/'+manifest.projectId+'/'+manifest.versionId+'/'))return {verified:false,reason:'storage_scope_mismatch'};
  let object;try{object=await bucket.head(file.storageKey);}catch{return {verified:false,reason:'storage_check_failed'};}
  if(!object)return {verified:false,reason:'file_missing'};
  if(object.size!==file.sizeBytes)return {verified:false,reason:'size_mismatch'};
  const mime=object.httpMetadata?.contentType;
  if(!mime||mime.toLowerCase()!==file.mimeType.toLowerCase())return {verified:false,reason:'mime_mismatch'};
  checked.push({storageKey:file.storageKey,sizeBytes:object.size,mimeType:mime,etag:object.etag||null});
 }
 return {verified:true,files:checked};
}
