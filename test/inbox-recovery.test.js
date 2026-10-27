import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverRecentInbox} from '../src/inbox-recovery.js';
const now=Date.parse('2026-10-27T05:00:00Z');
const row=(uid=1,extra={})=>({uid,path:'INBOX',messageId:'<message-'+uid+'@example.test>',date:new Date(now-60000).toISOString(),...extra});
function setup(rows,pages=1){const data=new Map(),events=[];return {data,events,args:{now,storage:{get:async key=>data.get(key)},list:async()=>({data:rows,pagination:{totalPages:pages}}),enqueue:async event=>{events.push(event);data.set('job:message:'+event.messageId,{state:'queued'});return {accepted:true};}}};}

test('recovery limits history and queues only valid recent inbox identifiers with forced review',async()=>{
 const s=setup([row(1),row(2,{date:new Date(now-25*3600000).toISOString()}),row(3,{path:'INBOX.Junk'}),row(4,{messageId:'bad\r\nheader'}),row(5,{uid:0}),row(6,{date:'invalid'}),row(7,{date:new Date(now+3600000).toISOString()})]);
 const result=await recoverRecentInbox(s.args);assert.equal(result.queued,1);assert.equal(result.skipped,6);assert.equal(result.reviewOnly,true);assert.deepEqual(s.events,[{messageId:row(1).messageId,forceReview:true}]);
 assert.ok(!JSON.stringify(result).includes('example.test'));assert.ok(!JSON.stringify(result).includes('messageId'));
});

test('recovery respects message, legacy UID and ambiguous-send tombstones and repeat calls add nothing',async()=>{
 const s=setup([row(1),row(2),row(3),row(4)]);s.data.set('job:message:'+row(1).messageId,{state:'escalation-pending'});s.data.set('job:INBOX:2',{state:'queued'});s.data.set('message:'+row(3).messageId,{state:'send-attempted'});
 const first=await recoverRecentInbox(s.args);assert.equal(first.queued,1);assert.equal(first.duplicates,3);const second=await recoverRecentInbox(s.args);assert.equal(second.queued,0);assert.equal(second.duplicates,4);assert.equal(s.events.length,1);
});

test('recovery caps each batch at twenty and reports more work without claiming complete history',async()=>{
 const s=setup(Array.from({length:25},(_,index)=>row(index+1)),2);const result=await recoverRecentInbox(s.args);assert.equal(result.queued,20);assert.equal(result.remaining,5);assert.equal(result.historyLimited,true);const next=await recoverRecentInbox(s.args);assert.equal(next.queued,5);assert.equal(next.duplicates,20);
});

test('provider failure and malformed metadata do not create new jobs',async()=>{
 const s=setup([]);s.args.list=async()=>{throw Error('Unavailable');};await assert.rejects(recoverRecentInbox(s.args));assert.equal(s.events.length,0);
 s.args.list=async()=>({data:{not:'an array'}});await assert.rejects(recoverRecentInbox(s.args));assert.equal(s.events.length,0);
});
