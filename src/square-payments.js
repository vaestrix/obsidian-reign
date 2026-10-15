import { automationWaiting } from './automation-window.js';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const API_VERSION='2026-09-16';
export function usdCents(value){
 if(typeof value!=='string'||!/^\d{1,7}(\.\d{1,2})?$/.test(value))throw Error('Enter a USD amount.');
 const [whole,fraction='']=value.split('.');const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(cents)||cents<1||cents>100000000)throw Error('Enter an amount between $0.01 and $1,000,000.');
 return cents;
}
const ready=env=>env.SQUARE_PAYMENTS_ENABLED==='true'&&env.SQUARE_ACCESS_TOKEN&&env.SQUARE_LOCATION_ID&&env.SQUARE_MERCHANT_ID&&env.SQUARE_WEBHOOK_SIGNATURE_KEY&&!automationWaiting(env);
async function square(env,path,body){
 const base=env.SQUARE_ENVIRONMENT==='sandbox'?'https://connect.squareupsandbox.com':'https://connect.squareup.com';
 const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+env.SQUARE_ACCESS_TOKEN,'Square-Version':API_VERSION,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'manual',signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('Square is temporarily unavailable.');return r.json();
}
export const publicPayment=p=>({id:p.id,projectId:p.projectId,label:p.label,amount:p.amount,currency:'USD',status:p.status,url:p.status==='pending'?p.url:null});
export async function squareOperation(operation,data,storage,env){
 if(!operation.startsWith('square-'))return null;
 if(operation==='square-list'){
  const project=await storage.get('project:'+data.id);
  if(!project||(!data.admin&&project.owner!==data.owner))return {error:'Project not found.'};
  const ids=await storage.get('square:project:'+data.id)||[];const payments=[];
  for(const id of ids){const p=await storage.get('square:request:'+id);if(p)payments.push(publicPayment(p));}
  return {payments,enabled:Boolean(ready(env))};
 }
 if(operation==='square-create'){
  if(!ready(env))return {error:'Square payments are not activated yet.'};
  const project=await storage.get('project:'+data.id);if(!project)return {error:'Project not found.'};
  // Only the authenticated studio route reaches this operation. Prices and scope
  // remain owner-approved; public estimator amounts are never trusted.
  let amount;try{amount=usdCents(data.amount);}catch(e){return {error:e.message};}
  const label=typeof data.label==='string'?data.label.trim():'';
  if(!label||label.length>120)return {error:'Add a payment description (up to 120 characters).'};
  const ids=await storage.get('square:project:'+project.id)||[];
  let payment;
  for(const id of ids){const p=await storage.get('square:request:'+id);if(p&&p.amount===amount&&p.label===label&&p.status!=='paid'&&p.status!=='review'){payment=p;break;}}
  if(payment?.status==='pending')return {payment:publicPayment(payment)};
  if(!payment){
   if(ids.length>=30)return {error:'Payment-request limit reached; contact the studio.'};
   payment={id:crypto.randomUUID(),projectId:project.id,amount,label,status:'creating',createdAt:Date.now()};
   await storage.put('square:request:'+payment.id,payment);await storage.put('square:project:'+project.id,[...ids,payment.id]);
  }
  try{
   const result=await square(env,'/v2/online-checkout/payment-links',{
    idempotency_key:payment.id,
    description:'Obsidian Reign Studios — '+label,
    order:{location_id:env.SQUARE_LOCATION_ID,reference_id:payment.id,line_items:[{name:'Obsidian Reign Studios — '+label,quantity:'1',base_price_money:{amount,currency:'USD'}}]},
    checkout_options:{allow_tipping:false,redirect_url:'https://obsidianreign.gg/client-portal?payment=returned'},payment_note:'Midnight Atlas Studios / Obsidian Reign Studios'
   });
   const link=result.payment_link;const url=new URL(link?.url);
   if(url.protocol!=='https:'||!(env.SQUARE_ENVIRONMENT==='sandbox'?['sandbox.square.link','sandbox.checkout.square.site']:['square.link','checkout.square.site']).includes(url.hostname)||!link.order_id)throw Error('Invalid checkout response');
   payment={...payment,status:'pending',url:url.href,orderId:link.order_id,linkId:link.id};
   await storage.put('square:order:'+payment.orderId,payment.id);await storage.put('square:request:'+payment.id,payment);
   return {payment:publicPayment(payment)};
  }catch{await storage.put('square:request:'+payment.id,{...payment,status:'creating'});return {error:'Checkout could not be confirmed. Retry this same request to recover it safely; do not create a replacement charge.'};}
 }
 if(operation==='square-event'){
  const event=data.event;
  if(!['payment.created','payment.updated'].includes(event.type))return {ignored:true};
  const id=event.data?.object?.payment?.id;if(!id||event.merchant_id!==env.SQUARE_MERCHANT_ID)return {ignored:true};
  // Reconcile the canonical payment rather than trusting a redirect or browser.
  const canonical=(await square(env,'/v2/payments/'+encodeURIComponent(id))).payment;
  const requestId=canonical?.order_id&&await storage.get('square:order:'+canonical.order_id);
  const payment=requestId&&await storage.get('square:request:'+requestId);
  if(!payment)return {ignored:true};
  if(canonical.location_id!==env.SQUARE_LOCATION_ID||canonical.amount_money?.currency!=='USD'||canonical.amount_money?.amount!==payment.amount)return {error:'Payment mismatch'};
  if(canonical.status!=='COMPLETED')return {ignored:true};
  const status=Number(canonical.refunded_money?.amount||0)>0?'review':'paid';
  if(payment.paymentId===canonical.id&&payment.status===status)return {duplicate:true};
  await storage.put('square:request:'+requestId,{...payment,status,paymentId:canonical.id,updatedAt:Date.now()});
  return {ok:true};
 }
 return {error:'Unknown payment operation.'};
}
export async function validSquareSignature(raw,signature,key,url){
 if(!key||!signature||signature.length>200)return false;
 try{const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['verify']);return crypto.subtle.verify('HMAC',k,Uint8Array.from(atob(signature),c=>c.charCodeAt(0)),new TextEncoder().encode(url+raw));}catch{return false;}
}
export async function squareWebhook(request,env){
 if(request.method!=='POST')return reply({error:'method-not-allowed'},405);
 if(!env.SQUARE_WEBHOOK_SIGNATURE_KEY||!env.PROJECT_HUB)return reply({error:'not-configured'},503);
 const reader=request.body?.getReader();let size=0;const chunks=[];
 if(!reader)return reply({error:'invalid-body'},400);
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();return reply({error:'too-large'},413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}const raw=new TextDecoder().decode(bytes);
 const url=env.SQUARE_WEBHOOK_URL||'https://obsidianreign.gg/webhooks/square';
 if(!await validSquareSignature(raw,request.headers.get('x-square-hmacsha256-signature'),env.SQUARE_WEBHOOK_SIGNATURE_KEY,url))return reply({error:'unauthorized'},401);
 let event;try{event=JSON.parse(raw);}catch{return reply({error:'invalid-json'},400);}
 try{const hub=env.PROJECT_HUB.get(env.PROJECT_HUB.idFromName('studio-projects'));const r=await hub.fetch(new Request('https://hub/square-event',{method:'POST',body:JSON.stringify({event})}));const result=await r.json();return reply(result,result.error?409:200);}catch{return reply({error:'reconciliation-unavailable'},503);}
}
