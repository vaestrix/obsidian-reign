// Evidence types distinguish an owner's production authorization from actual customer approval.
export function validateApprovalEvidence(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const {kind,reference,approvedAt}=input;
 if(!['owner_scope_authorization','customer_written_approval','customer_portal_review'].includes(kind))return null;
 if(typeof reference!=='string'||reference.trim().length<8||reference.length>300)return null;
 if(typeof approvedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(approvedAt)||!Number.isFinite(Date.parse(approvedAt)))return null;
 return {kind,reference:reference.trim(),approvedAt:new Date(approvedAt).toISOString()};
}
export function authorizesInitialCreativeTask(evidence){
 return evidence?.kind==='owner_scope_authorization';
}
