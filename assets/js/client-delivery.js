// Browser-side helper for customer downloads. Import from the client portal UI.
// Uses same-origin authenticated requests and does not expose R2 storage keys.
export async function downloadApprovedAsset({projectId,versionId,fileName,fetcher=fetch,saveFile}){
 if(typeof projectId!=='string'||typeof versionId!=='string'||typeof fileName!=='string'||!projectId||!versionId||!fileName)throw new Error('Invalid download request');
 const params=new URLSearchParams({projectId,versionId,file:fileName});
 const url='/api/portal/delivery-download?'+params;
 let response=await fetcher(url,{method:'GET',credentials:'same-origin',cache:'no-store'});
 if(response.status===409){
  let problem;try{problem=await response.clone().json();}catch{problem=null;}
  if(problem?.refreshRequired===true){
   const refreshed=await fetcher('/api/portal/delivery-refresh-check',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId,versionId})});
   if(!refreshed.ok)throw new Error('Your files need additional verification. Please contact support.');
   response=await fetcher(url,{method:'GET',credentials:'same-origin',cache:'no-store'});
  }
 }
 if(!response.ok)throw new Error('This download is not available yet. Please contact support.');
 if(typeof saveFile!=='function')return response;
 return saveFile(response,fileName);
}
