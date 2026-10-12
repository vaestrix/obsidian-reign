// Pure, side-effect-free workflow guard. Persistence and authentication must be enforced by callers.
export const ORDER_STATES = Object.freeze(['qualified','handed_to_savannah','brief_confirmed','quote_approved','production_queued','preview_ready','customer_review','revision_requested','approved','quality_verified','delivered','closed']);
const transitions = Object.freeze({
  qualified:{handed_to_savannah:['anna']},
  handed_to_savannah:{brief_confirmed:['savannah']},
  brief_confirmed:{quote_approved:['savannah','owner']},
  quote_approved:{production_queued:['savannah','owner']},
  production_queued:{preview_ready:['vesper']},
  preview_ready:{customer_review:['savannah']},
  customer_review:{revision_requested:['savannah'],approved:['savannah']},
  revision_requested:{production_queued:['savannah']},
  approved:{quality_verified:['vesper']},
  quality_verified:{delivered:['savannah']},
  delivered:{closed:['savannah','owner']},
  closed:{}
});
export function authorizeOrderTransition({from,to,actor,approvalEvidence}) {
  if (!ORDER_STATES.includes(from) || !ORDER_STATES.includes(to)) return false;
  if (!transitions[from]?.[to]?.includes(actor)) return false;
  if (['quote_approved','approved'].includes(to) && (typeof approvalEvidence !== 'string' || approvalEvidence.trim().length < 8)) return false;
  return true;
}
export function assertOrderTransition(change) {
  if (!authorizeOrderTransition(change)) throw new Error('Order transition denied by policy');
  return true;
}
