import test from 'node:test';import assert from 'node:assert/strict';import {agentHealth} from '../src/agent-health.js';
test('mailbox health returns only aggregate endpoint checks, never secrets',async t=>{
 const original=fetch;globalThis.fetch=async url=>Response.json({data:[{status:'active',events:['message.received'],url:'https://obsidianreign.gg/webhooks/hostinger'+(url.includes('/anna/')?'/anna':''),secret:'PRIVATE'}],pagination:{totalPages:1}});t.after(()=>globalThis.fetch=original);
 const r=await agentHealth({ANNA_MAILBOX_ID:'anna',ANNA_MAIL_API_TOKEN:'PRIVATE',HOSTINGER_MAILBOX_ID:'savannah',HOSTINGER_MAIL_API_TOKEN:'PRIVATE'});
 assert.equal(r.anna.correctEndpoint,1);assert.equal(r.savannah.correctEndpoint,1);assert.doesNotMatch(JSON.stringify(r),/PRIVATE|Bearer/);
});
