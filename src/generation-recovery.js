// Provider-neutral generation state reconciliation. No external API calls or charges.
export const GENERATION_STATES=Object.freeze(['pending_owner_approval','approved_not_submitted','submission_uncertain','submitted','completed','failed','rejected']);
export function nextGenerationAction(reservation){
  if(!reservation||typeof reservation!=='object')return 'manual_review';
  if(reservation.status==='pending_owner_approval')return 'await_owner_approval';
  if(reservation.status==='rejected'||reservation.status==='completed'||reservation.status==='failed')return 'stop';
  if(reservation.status==='approved_not_submitted')return 'submit_once_with_idempotency';
  if(reservation.status==='submission_uncertain')return 'reconcile_with_provider_do_not_resubmit';
  if(reservation.status==='submitted')return reservation.providerJobId?'poll_provider_job':'manual_review';
  return 'manual_review';
}
export function safeProviderStatus({providerJobId,providerStatus}){
  if(typeof providerJobId!=='string'||!providerJobId.trim()||providerJobId.length>160)return null;
  const mapping={SUCCEEDED:'completed',FAILED:'failed',CANCELLED:'failed',RUNNING:'submitted',PENDING:'submitted',THROTTLED:'submitted'};
  return Object.hasOwn(mapping,providerStatus)?{providerJobId,status:mapping[providerStatus]}:null;
}
