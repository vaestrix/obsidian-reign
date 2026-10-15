// Authenticated by the existing scoped Anna token at the Worker boundary.
export async function agentHealth(env) {
 const check=async (id,token,suffix)=>{
  if(!id||!token)return {configured:false};
  const r=await fetch('https://api.mail.hostinger.com/api/v1/mailboxes/'+encodeURIComponent(id)+'/webhooks?perPage=100',{headers:{Authorization:'Bearer '+token},redirect:'manual',signal:AbortSignal.timeout(15000)});
  if(!r.ok)return {configured:true,providerStatus:r.status};
  const body=await r.json();const hooks=body.data;
  if(!Array.isArray(hooks))return {configured:true,error:'unexpected-provider-response'};
  const active=hooks.filter(h=>h.status==='active'&&h.events?.includes('message.received'));
  return {configured:true,activeInboundWebhooks:active.length,correctEndpoint:active.filter(h=>h.url==='https://obsidianreign.gg'+suffix).length,paginationComplete:(body.pagination?.totalPages??1)<=1};
 };
 const [anna,savannah]=await Promise.all([check(env.ANNA_MAILBOX_ID,env.ANNA_MAIL_API_TOKEN,'/webhooks/hostinger/anna'),check(env.HOSTINGER_MAILBOX_ID,env.HOSTINGER_MAIL_API_TOKEN,'/webhooks/hostinger')]);
 return {anna,savannah};
}
