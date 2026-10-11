const formats=new Set(['image/png','image/webp','image/gif','video/webm','video/mp4','audio/mpeg','audio/wav','application/zip']);
export function validateDeliveryManifest(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const {projectId,versionId,files}=input;
 if(typeof projectId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(projectId)||typeof versionId!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(versionId))return null;
 if(!Array.isArray(files)||files.length<1||files.length>30)return null;
 const normalized=[];
 for(const file of files){
  if(!file||typeof file!=='object'||typeof file.name!=='string'||file.name.length<1||file.name.length>160||!formats.has(file.mimeType)||!Number.isSafeInteger(file.sizeBytes)||file.sizeBytes<1||file.sizeBytes>2_000_000_000)return null;
  if(typeof file.storageKey!=='string'||!/^deliveries\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_./-]{1,400}$/.test(file.storageKey)||file.storageKey.includes('..'))return null;
  if(!file.storageKey.startsWith('deliveries/'+projectId+'/'+versionId+'/'))return null;
  normalized.push({name:file.name,mimeType:file.mimeType,sizeBytes:file.sizeBytes,storageKey:file.storageKey});
 }
 return {projectId,versionId,files:normalized,status:'manifest_pending_file_verification'};
}
