// Pure delivery authorization decision for runtime and integration tests.
import {currentCustomerApproval} from './customer-approval-guard.js';
export function authorizeCustomerDelivery({project,owner,versionId,authorization,manifest,verification,now=Date.now()}){
 if(!project||project.owner!==owner)return {allowed:false,reason:'access_denied'};
 if(!currentCustomerApproval(project,versionId))return {allowed:false,reason:'current_approval_required'};
 if(!authorization||authorization.status!=='authorized_not_delivered')return {allowed:false,reason:'owner_authorization_required'};
 if(!manifest||manifest.projectId!==project.id||manifest.versionId!==versionId)return {allowed:false,reason:'manifest_missing'};
 if(!verification||verification.projectId!==project.id||verification.versionId!==versionId||!Number.isFinite(Date.parse(verification.verifiedAt))||now-Date.parse(verification.verifiedAt)>15*60*1000||now<Date.parse(verification.verifiedAt))return {allowed:false,reason:'fresh_verification_required'};
 return {allowed:true};
}
