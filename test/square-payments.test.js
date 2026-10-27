import test from 'node:test';import assert from 'node:assert/strict';
import {usdCents,depositCents,squareOperation,publicInvoice,validSquareSignature,squareWebhook} from '../src/square-payments.js';
import {ProjectHub} from '../src/portal.js';
function setup(){const rows=new Map([['project:p',{id:'p',title:'Branding',owner:'invite:owner',quoteAmount:'100.00',quoteStatus:'Accepted',stage:0}]]);const storage={get:async k=>structuredClone(rows.get(k)),put:async(k,v)=>rows.set(k,structuredClone(v)),list:async({prefix})=>new Map([...rows].filter(([k])=>k.startsWith(prefix))),getAlarm:async()=>1};storage.transaction=fn=>fn(storage);return {rows,storage,env:{SQUARE_PAYMENTS_ENABLED:'true',SQUARE_ACCESS_TOKEN:'test',SQUARE_LOCATION_ID:'loc',SQUARE_MERCHANT_ID:'merchant',SQUARE_WEBHOOK_SIGNATURE_KEY:'key',SQUARE_ENVIRONMENT:'sandbox'}};}
function mockSquare(t,s,{failDraft=false}={}) {
 const calls=[];let published=false,paid=0,draftFailures=failDraft?1:0,invoiceChanges={},paymentChanges={},refundChanges={},failReads=false;
 const original=fetch;
 const invoice=()=>({id:'inv:test',location_id:'loc',version:published?1:0,order_id:'order',primary_recipient:{customer_id:'customer'},
  status:published?(paid===10000?'PAID':paid?'PARTIALLY_PAID':'UNPAID'):'DRAFT',public_url:published?'https://app.squareupsandbox.com/pay-invoice/test':undefined,
  payment_requests:[{request_type:'DEPOSIT',percentage_requested:'15',computed_amount_money:{amount:1500,currency:'USD'},total_completed_amount_money:{amount:Math.min(paid,1500),currency:'USD'},automatic_payment_source:'NONE'},
   {request_type:'BALANCE',due_date:'2099-11-01',total_completed_amount_money:{amount:Math.max(0,paid-1500),currency:'USD'},automatic_payment_source:'NONE'}],...invoiceChanges});
 globalThis.fetch=async(url,opts={})=>{
  const body=opts.body&&JSON.parse(opts.body);calls.push({url,body});assert.ok(url.startsWith('https://connect.squareupsandbox.com/'));
  if(failReads&&!body)throw Error('Provider unavailable');
  if(url.endsWith('/v2/customers'))return Response.json({customer:{id:'customer'}});
  if(url.endsWith('/v2/orders'))return Response.json({order:{id:'order'}});
  if(url.endsWith('/v2/invoices')&&body){if(draftFailures-- >0)throw Error('timeout');assert.equal(body.invoice.payment_requests[0].percentage_requested,'15');assert.equal(body.invoice.delivery_method,'EMAIL');assert.equal(body.invoice.payment_requests[0].automatic_payment_source,'NONE');return Response.json({invoice:invoice()});}
  if(url.endsWith('/publish')){published=true;return Response.json({invoice:invoice()});}
  if(url.endsWith('/v2/orders/order'))return Response.json({order:{id:'order',location_id:'loc',total_money:{amount:10000,currency:'USD'}}});
  if(url.endsWith('/v2/invoices/inv%3Atest'))return Response.json({invoice:invoice()});
  if(url.endsWith('/v2/payments/pay'))return Response.json({payment:{id:'pay',status:'COMPLETED',order_id:'order',location_id:'loc',...paymentChanges}});
  if(url.endsWith('/v2/refunds/refund'))return Response.json({refund:{id:'refund',payment_id:'pay',location_id:'loc',order_id:'refund-order',status:'PENDING',...refundChanges}});
  throw Error('Unexpected request '+url);
 };
 t.after(()=>globalThis.fetch=original);
 return {calls,setPaid:n=>paid=n,invoice,setInvoice:value=>invoiceChanges=value,setPayment:value=>paymentChanges=value,setRefund:value=>refundChanges=value,setReadFailure:value=>failReads=value};
}
const draft={id:'p',email:'customer@example.test',balanceDue:'2099-11-01'};
test('15% is computed in exact cents and malformed totals are rejected',()=>{assert.equal(usdCents('149.99'),14999);assert.equal(depositCents(14999),2250);assert.equal(depositCents(10000),1500);for(const x of ['0','-1','1.001','1e3',12])assert.throws(()=>usdCents(x));});
test('legacy standalone checkout cannot bypass invoices',async()=>{const s=setup();assert.match((await squareOperation('square-create',{id:'p',amount:'1'},s.storage,s.env)).error,/Standalone checkout is disabled/);assert.equal(s.rows.size,1);});
test('prelaunch draft and send make no provider requests',async t=>{const s=setup();const m=mockSquare(t,s);s.env.AGENTS_START_AT='2099-10-20T05:00:00Z';for(const op of ['square-invoice-draft','square-invoice-send'])assert.ok((await squareOperation(op,draft,s.storage,s.env)).error);assert.equal(m.calls.length,0);});
test('draft uses saved quote, requests 15%, and exposes no payment URL',async t=>{const s=setup(),m=mockSquare(t,s);const d=await squareOperation('square-invoice-draft',{...draft,amount:'0.01'},s.storage,s.env);assert.equal(d.invoice.total,10000);assert.equal(d.invoice.deposit,1500);assert.equal(d.invoice.status,'draft');assert.equal(d.invoice.url,null);assert.equal(m.calls.length,3);assert.ok(!m.calls.some(c=>c.url.endsWith('/publish')));});
test('ambiguous draft creation resumes the same invoice without duplicate customer/order',async t=>{const s=setup(),m=mockSquare(t,s,{failDraft:true});assert.ok((await squareOperation('square-invoice-draft',draft,s.storage,s.env)).error);assert.equal((await squareOperation('square-invoice-draft',draft,s.storage,s.env)).invoice.status,'draft');const requests=m.calls.filter(c=>c.url.endsWith('/v2/invoices'));assert.equal(requests[0].body.idempotency_key,requests[1].body.idempotency_key);assert.equal(m.calls.filter(c=>c.url.endsWith('/v2/customers')).length,1);});
test('only sending publishes and unlocks invoice; repeat send does not email again',async t=>{const s=setup(),m=mockSquare(t,s);await squareOperation('square-invoice-draft',draft,s.storage,s.env);const sent=await squareOperation('square-invoice-send',{id:'p'},s.storage,s.env);assert.equal(sent.invoice.status,'sent');assert.ok(sent.invoice.url);await squareOperation('square-invoice-send',{id:'p'},s.storage,s.env);assert.equal(m.calls.filter(c=>c.url.endsWith('/publish')).length,1);assert.equal(publicInvoice(s.rows.get('square:invoice:p'),false).url,null);});
test('changed quote or recipient cannot quietly create a second invoice',async t=>{const s=setup();mockSquare(t,s);await squareOperation('square-invoice-draft',draft,s.storage,s.env);assert.ok((await squareOperation('square-invoice-draft',{...draft,email:'other@example.test'},s.storage,s.env)).error);s.rows.get('project:p').quoteAmount='200';assert.ok((await squareOperation('square-invoice-send',{id:'p'},s.storage,s.env)).error);});
test('invoice listing enforces ownership and never exposes private recipient details',async t=>{const s=setup();mockSquare(t,s);await squareOperation('square-invoice-draft',draft,s.storage,s.env);assert.ok((await squareOperation('square-list',{id:'p',owner:'invite:other'},s.storage,s.env)).error);const d=await squareOperation('square-list',{id:'p',owner:'invite:owner'},s.storage,s.env);assert.equal(d.invoice.email,undefined);assert.equal(d.invoice.url,null);});
test('signed payment reconciliation confirms deposit separately from full payment',async t=>{const s=setup(),m=mockSquare(t,s);await squareOperation('square-invoice-draft',draft,s.storage,s.env);await squareOperation('square-invoice-send',{id:'p'},s.storage,s.env);m.setPaid(1500);const event={event:{type:'invoice.payment_made',merchant_id:'merchant',data:{object:{invoice:{id:'inv:test'}}}}};assert.equal((await squareOperation('square-event',event,s.storage,s.env)).depositPaid,true);assert.equal(s.rows.get('square:invoice:p').status,'partially-paid');assert.equal(s.rows.get('square:invoice:p').totalPaid,1500);await squareOperation('square-event',event,s.storage,s.env);m.setPaid(10000);await squareOperation('square-event',event,s.storage,s.env);assert.equal(s.rows.get('square:invoice:p').status,'paid');});
test('work advances only after a fresh Square deposit check, even when the last webhook said paid',async t=>{
 const s=setup(),m=mockSquare(t,s);const hub=new ProjectHub({storage:s.storage,blockConcurrencyWhile:fn=>fn()},s.env);
 const save=async stage=>(await hub.fetch(new Request('https://hub/save',{method:'POST',body:JSON.stringify({...s.rows.get('project:p'),stage})}))).json();
 assert.match((await save(1)).error,/15% deposit/);
 await squareOperation('square-invoice-draft',draft,s.storage,s.env);await squareOperation('square-invoice-send',{id:'p'},s.storage,s.env);
 m.setPaid(1500);assert.equal((await save(1)).project.stage,1);
 m.setInvoice({status:'REFUNDED'});assert.match((await save(2)).error,/15% deposit/);assert.equal(s.rows.get('project:p').stage,1);assert.equal(s.rows.get('square:invoice:p').depositPaid,false);
});
test('webhook signatures cover exact body and URL',async()=>{const key='secret',url='https://example.test/webhooks/square',raw='{}';const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(url+raw)))));assert.equal(await validSquareSignature(raw,sig,key,url),true);assert.equal(await validSquareSignature(raw+' ',sig,key,url),false);assert.equal((await squareWebhook(new Request(url,{method:'POST',body:raw}),{SQUARE_WEBHOOK_SIGNATURE_KEY:key,PROJECT_HUB:{}})).status,401);});

test('unaccepted quotations cannot draft or publish invoices',async t=>{const s=setup(),m=mockSquare(t,s);for(const status of ['Not quoted','Draft','Sent','Declined']){s.rows.get('project:p').quoteStatus=status;assert.match((await squareOperation('square-invoice-draft',draft,s.storage,s.env)).error,/accept the written quote/);}assert.equal(m.calls.length,0);s.rows.get('project:p').quoteStatus='Accepted';await squareOperation('square-invoice-draft',draft,s.storage,s.env);s.rows.get('project:p').quoteStatus='Sent';assert.ok((await squareOperation('square-invoice-send',{id:'p'},s.storage,s.env)).error);assert.equal(m.calls.filter(c=>c.url.endsWith('/publish')).length,0);});

const eventFor=(type,object)=>({event:{merchant_id:'merchant',type,data:{object}}});
async function paidInvoice(s,m){await squareOperation('square-invoice-draft',draft,s.storage,s.env);await squareOperation('square-invoice-send',{id:'p'},s.storage,s.env);m.setPaid(1500);await squareOperation('square-event',eventFor('invoice.payment_made',{invoice:{id:'inv:test'}}),s.storage,s.env);}

test('pending refunds hold the original payment project and a later stale invoice event cannot unlock it',async t=>{
 const s=setup(),m=mockSquare(t,s);await paidInvoice(s,m);
 const event=eventFor('refund.created',{refund:{id:'refund',order_id:'untrusted-order'}});
 for(let repeat=0;repeat<2;repeat++){const result=await squareOperation('square-event',event,s.storage,s.env);assert.equal(result.requiresReview,true);assert.equal(result.depositPaid,false);}
 assert.equal(s.rows.get('square:invoice:p').reviewReason,'refund-review-required');
 assert.equal((await squareOperation('square-event',eventFor('invoice.updated',{invoice:{id:'inv:test'}}),s.storage,s.env)).depositPaid,false);
 assert.ok(!m.calls.some(call=>call.body&&call.url.endsWith('/v2/refunds')));
});

test('foreign merchant/location refunds cannot modify an invoice',async t=>{
 const s=setup(),m=mockSquare(t,s);await paidInvoice(s,m);const count=m.calls.length;
 const foreign=eventFor('refund.updated',{refund:{id:'refund'}});foreign.event.merchant_id='other';assert.equal((await squareOperation('square-event',foreign,s.storage,s.env)).ignored,true);assert.equal(m.calls.length,count);
 m.setRefund({location_id:'other'});assert.equal((await squareOperation('square-event',eventFor('refund.updated',{refund:{id:'refund'}}),s.storage,s.env)).ignored,true);assert.equal(s.rows.get('square:invoice:p').depositPaid,true);
});

test('failed payment and scheduled charge failures hold production without sending anything',async t=>{
 const s=setup(),m=mockSquare(t,s);await paidInvoice(s,m);m.setPayment({status:'FAILED'});
 assert.equal((await squareOperation('square-event',eventFor('payment.updated',{payment:{id:'pay'}}),s.storage,s.env)).requiresReview,true);
 assert.equal(s.rows.get('square:invoice:p').reviewReason,'payment-failure-review-required');
 const before=m.calls.filter(call=>call.body).length;
 assert.equal((await squareOperation('square-event',eventFor('invoice.scheduled_charge_failed',{invoice:{id:'inv:test'}}),s.storage,s.env)).requiresReview,true);
 assert.equal(m.calls.filter(call=>call.body).length,before);
});

test('unexpected invoice state, wrong invoice location and malformed paid money fail closed',async t=>{
 const s=setup(),m=mockSquare(t,s);await paidInvoice(s,m);
 for(const changed of [{status:'UNKNOWN_NEW_STATE'},{location_id:'other'},{payment_requests:m.invoice().payment_requests.map(request=>({...request,total_completed_amount_money:{amount:1500,currency:'EUR'}}))},{payment_requests:m.invoice().payment_requests.map(request=>({...request,total_completed_amount_money:{amount:-1,currency:'USD'}}))}]){
  m.setInvoice(changed);assert.equal((await squareOperation('square-event',eventFor('invoice.updated',{invoice:{id:'inv:test'}}),s.storage,s.env)).requiresReview,true);assert.equal(s.rows.get('square:invoice:p').depositPaid,false);
 }
});

test('provider outage during advancement revokes cached deposit confidence and preserves the milestone',async t=>{
 const s=setup(),m=mockSquare(t,s);await paidInvoice(s,m);m.setReadFailure(true);
 const hub=new ProjectHub({storage:s.storage,blockConcurrencyWhile:fn=>fn()},s.env);
 const result=await(await hub.fetch(new Request('https://hub/save',{method:'POST',body:JSON.stringify({...s.rows.get('project:p'),stage:1})}))).json();
 assert.match(result.error,/could not be verified/);assert.equal(s.rows.get('project:p').stage,0);assert.equal(s.rows.get('square:invoice:p').depositPaid,false);assert.equal(s.rows.get('square:invoice:p').status,'review');
});

test('an existing invoice prevents reassignment to another client account',async t=>{
 const s=setup();mockSquare(t,s);await squareOperation('square-invoice-draft',draft,s.storage,s.env);
 const hub=new ProjectHub({storage:s.storage,blockConcurrencyWhile:fn=>fn()},s.env);
 const result=await(await hub.fetch(new Request('https://hub/save',{method:'POST',body:JSON.stringify({...s.rows.get('project:p'),owner:'invite:someone-else'})}))).json();
 assert.match(result.error,/cannot be reassigned/);assert.equal(s.rows.get('project:p').owner,'invite:owner');
});
