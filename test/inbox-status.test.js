import test from 'node:test';
import assert from 'node:assert/strict';
import {inboxStatus} from '../src/inbox-status.js';
test('status paginates and returns counts without identities, content or writes',async()=>{
 const rows=Array.from({length:1001},(_,i)=>['anna:outbox:'+String(i).padStart(4,'0'),{state:i===1000?'send-outcome-unknown':'sent',message:{text:'PRIVATE',to:['private@example.com']}}]);let calls=0;
 const storage={async list({prefix,limit,startAfter}){calls++;return new Map(rows.filter(([k])=>k.startsWith(prefix)&&(!startAfter||k>startAfter)).slice(0,limit));}};
 const result=await inboxStatus(storage,{ANNA_AUTO_SEND:'true',SAVANNAH_AUTO_SEND:'false'});
 assert.deepEqual(result.outreach,{sent:1000,'send-outcome-unknown':1});assert.deepEqual(result.inboxJobs,{});assert.equal(calls,3);
 assert.deepEqual(result.switches,{anna:true,savannah:false});assert.doesNotMatch(JSON.stringify(result),/PRIVATE|private@example|anna:outbox/);
});

