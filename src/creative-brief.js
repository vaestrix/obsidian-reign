// Explicit, non-executing production brief validation for Vesper.
const types=new Set(['emote','animated_emote','alert','overlay','transition','creator_branding']);
const platforms=new Set(['twitch','kick','youtube','discord','other']);
export function validateCreativeBrief(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const {projectId,assetType,platform,description,referenceUrls=[]}=input;
 if(typeof projectId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(projectId))return null;
 if(!types.has(assetType)||!platforms.has(platform))return null;
 if(typeof description!=='string'||description.trim().length<10||description.length>3000)return null;
 if(!Array.isArray(referenceUrls)||referenceUrls.length>8)return null;
 const references=[];
 for(const raw of referenceUrls){
  if(typeof raw!=='string'||raw.length>1500)return null;
  let url;try{url=new URL(raw);}catch{return null;}
  if(url.protocol!=='https:'||url.username||url.password)return null;
  references.push(url.href);
 }
 return {projectId,assetType,platform,description:description.trim(),referenceUrls:references,status:'draft',requiresCustomerApproval:true};
}
export function productionReadiness(brief){
 if(!brief)return {ready:false,reason:'invalid_brief'};
 if(brief.status!=='approved')return {ready:false,reason:'customer_approval_required'};
 if(!brief.paymentAuthorized)return {ready:false,reason:'payment_authorization_required'};
 if(!brief.ownerGenerationApproved)return {ready:false,reason:'generation_approval_required'};
 return {ready:true};
}
