// Safe automatic refresh policy for customer downloads after verification expires.
// Refresh must compare every R2 object's ETag to the previously approved snapshot.
// This module makes no storage writes or provider calls.
export function canRefreshDelivery({project,owner,versionId,authorization,manifest,verification,now=Date.now()}) {
 if(!project||project.owner!==owner)return {allowed:false,reason:'access_denied'};
 const latest=project.reviews?.[0];
 if(!latest||latest.id!==versionId||latest.status!=='approved'||!latest.decidedAt)return {allowed:false,reason:'current_approval_required'};
 if(authorization?.status!=='authorized_not_delivered')return {allowed:false,reason:'owner_authorization_required'};
 if(!manifest||manifest.projectId!==project.id||manifest.versionId!==versionId||!Array.isArray(manifest.files)||!manifest.files.length)return {allowed:false,reason:'manifest_missing'};
 if(!verification||verification.projectId!==project.id||verification.versionId!==versionId||!Array.isArray(verification.files)||verification.files.length!==manifest.files.length)return {allowed:false,reason:'verification_missing'};
 if(!Number.isFinite(Date.parse(verification.verifiedAt))||now<Date.parse(verification.verifiedAt))return {allowed:false,reason:'invalid_verification_time'};
 if(!manifest.files.every(f=>verification.files.some(v=>v.storageKey===f.storageKey&&v.sizeBytes===f.sizeBytes&&v.mimeType===f.mimeType&&typeof v.etag==='string'&&v.etag.length>0)))return {allowed:false,reason:'file_set_changed'};
 return {allowed:true,requiresR2Recheck:now-Date.parse(verification.verifiedAt)>15*60*1000};
}
export function unchangedR2Snapshot(prior,checked) {
 if(!Array.isArray(prior)||!Array.isArray(checked)||prior.length!==checked.length)return false;
 return prior.every(f=>checked.some(v=>v.storageKey===f.storageKey&&v.etag===f.etag&&v.sizeBytes===f.sizeBytes&&v.mimeType===f.mimeType));
}
