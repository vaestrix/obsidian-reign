// Internal-only agent routing policy. Never expose this module as a public API.
export const AGENTS = Object.freeze({
  anna: Object.freeze({role:'acquisition', customerFacing:true}),
  savannah: Object.freeze({role:'customer_success', customerFacing:true}),
  vesper: Object.freeze({role:'creative_production', customerFacing:false}),
  atlas: Object.freeze({role:'operations', customerFacing:false}),
  forge: Object.freeze({role:'engineering', customerFacing:false}),
  mercury: Object.freeze({role:'finance', customerFacing:false}),
  sentinel: Object.freeze({role:'security_quality', customerFacing:false}),
  nova: Object.freeze({role:'product_research', customerFacing:false})
});
const internalRecipients = new Set(['savannah','owner']);
export function authorizeAgentMessage({from,to,channel}) {
  if (from !== 'owner' && !Object.hasOwn(AGENTS,from)) return false;
  if (typeof to !== 'string' || typeof channel !== 'string') return false;
  if (from === 'vesper') return channel === 'internal' && internalRecipients.has(to);
  if (to === 'vesper') return channel === 'internal' && internalRecipients.has(from);
  if (channel === 'customer') return to === 'customer' && AGENTS[from].customerFacing;
  if (channel !== 'internal') return false;
  return to === 'owner' || Object.hasOwn(AGENTS,to);
}
export function assertAgentMessage(message) {
  if (!authorizeAgentMessage(message)) throw new Error('Agent message denied by policy');
  return true;
}
