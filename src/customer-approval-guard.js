// Require approval of the exact latest preview; previous approvals never authorize revised artwork.
export function currentCustomerApproval(project,versionId){
 if(!project||typeof versionId!=='string'||!versionId)return null;
 const latest=project.reviews?.[0];
 if(!latest||latest.id!==versionId||latest.status!=='approved'||!latest.decidedAt)return null;
 return {projectId:project.id,versionId:latest.id,approvedAt:latest.decidedAt,source:'authenticated_client_portal'};
}
