import test from 'node:test';
import assert from 'node:assert/strict';
import {automationStart,automationWaiting} from '../src/automation-window.js';
import {queueProspect,dispatchProspects} from '../src/anna-runtime.js';
import {SavannahInbox} from '../src/savannah.js';
const start='2026-10-20T05:00:00Z';
test('Chicago October 20 launch boundary is exact and invalid dates fail closed',()=>{
 const env={AGENTS_START_AT:start};const at=Date.parse(start);
 assert.equal(automationWaiting(env,at-1),true);assert.equal(automationWaiting(env,at),false);
 assert.throws(()=>automationStart({AGENTS_START_AT:'invalid'}));
});
test('prelaunch rejects reservations without storage or fetch, and defers inbox processing',async t=>{
 const env={AGENTS_START_AT:'2099-10-20T05:00:00Z'};let alarm;let calls=0;
 const original=globalThis.fetch;globalThis.fetch=()=>{calls++;throw Error('must not send');};t.after(()=>globalThis.fetch=original);
 const ctx={storage:{setAlarm:async value=>alarm=value}};
 const response=await queueProspect(ctx,env,{});assert.equal(response.status,503);assert.equal((await response.json()).error,'launch-not-started');
 await dispatchProspects(ctx,env);const inbox=new SavannahInbox(ctx,env);await inbox.alarm();
 assert.equal(alarm,Date.parse(env.AGENTS_START_AT)+1000);assert.equal(calls,0);
 await assert.rejects(()=>inbox.process('x',{}),/launch-not-started/);
});
test('only exact owner-approved recipient, subject and body can override the campaign template',async()=>{
 const lead={email:'creator@example.com',name:'Creator',observation:'Your channel features cooperative games.',channelUrl:'https://example.com/channel',contactSourceUrl:'https://example.com/contact',verifiedAt:new Date().toISOString(),publicBusinessContact:true,contactVerified:true,outreachEligible:true,language:'English',segment:'smaller growing streamers',approvedDraft:{subject:'Approved subject',text:'Approved AI commercial introduction'}};
 const env={SAVANNAH_AUTO_SEND:'true',ANNA_AUTO_SEND:'true',ANNA_OUTREACH_VERIFIED:'true',ANNA_POSTAL_ADDRESS_CONFIRMED:'true',ANNA_BUSINESS_ADDRESS:'QA Studio, 100 Test Street, Test City, TX 00000',ANNA_MAIL_API_TOKEN:'test',ANNA_MAILBOX_ID:'anna'};
 const data=new Map();const storage={get:async k=>data.get(k),put:async(k,v)=>data.set(k,v),getAlarm:async()=>null,setAlarm:async()=>{},transaction:async fn=>fn(storage)};
 const ctx={storage,blockConcurrencyWhile:fn=>fn()};
 assert.equal((await queueProspect(ctx,env,lead)).status,403);
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(lead.email+'\n'+lead.approvedDraft.subject+'\n'+lead.approvedDraft.text));
 env.ANNA_APPROVED_DRAFT_HASHES=JSON.stringify([[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')]);
 assert.equal((await queueProspect(ctx,env,{...lead,approvedDraft:{...lead.approvedDraft,text:'Changed text'}})).status,403);
 assert.equal((await queueProspect(ctx,env,lead)).status,202);
 assert.equal([...data.entries()].find(([k])=>k.startsWith('anna:outbox:'))[1].message.subject,'Approved subject');
});
