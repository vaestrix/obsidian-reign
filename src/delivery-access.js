// Pure delivery authorization decision for runtime and integration tests.
import {currentCustomerApproval} from './customer-approval-guard.js';
export function authorizeCustomerDelivery({project,owner,versionId,authorization,manifest,verification,now=Date.now()}){
 if(!project||project.owner!==owner)return {allowed:false,reason:'access_denied'};
 if(!currentCustomerApproval(project,versionId))return {allowed:false,reason:'current_approval_required'};
 if(!authorization||authorization.status!=='authorized_not_delivered')return {allowed:false,reason:'owner_authorization_required'};
 if(!manifest||manifest.projectId!==project.id||manifest.versionId!==versionId||manifest.status!=='manifest_pending_file_verification')return {allowed:false,reason:'manifest_missing'};
 if(!verification||verification.projectId!==project.id||verification.versionId!==versionId||!Number.isFinite(Date.parse(verification.verifiedAt))||now-Date.parse(verification.verifiedAt)>15*60*1000||now<Date.parse(verification.verifiedAt))return {allowed:false,reason:'fresh_verification_required'};
 if(!Array.isArray(manifest.files)||manifest.files.length===0||!Array.isArray(verification.files)||verification.files.length!==manifest.files.length)return {allowed:false,reason:'verification_mismatch'};
 if(new Set(manifest.files.map(f=>f.storageKey)).size!==manifest.files.length||new Set(verification.files.map(f=>f.storageKey)).size!==verification.files.length)return {allowed:false,reason:'verification_mismatch'};
 if(!manifest.files.every(f=>verification.files.some(v=>v.storageKey===f.storageKey&&v.sizeBytes===f.sizeBytes&&v.mimeType===f.mimeType&&typeof v.etag==='string'&&v.etag.length>0)))return {allowed:false,reason:'verification_mismatch'};
 return {allowed:true};
}
