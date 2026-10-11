import test from 'node:test';
import assert from 'node:assert/strict';
import {canRefreshDelivery,unchangedR2Snapshot} from '../src/delivery-refresh.js';
const now=Date.parse('2026-10-11T12:00:00Z');
const file={storageKey:'deliveries/p1/v1/emote.png',sizeBytes:100,mimeType:'image/png',etag:'abc'};
const args={project:{id:'p1',owner:'google:alice',reviews:[{id:'v1',status:'approved',decidedAt:'2026-10-10T12:00:00Z'}]},owner:'google:alice',versionId:'v1',authorization:{status:'authorized_not_delivered'},manifest:{projectId:'p1',versionId:'v1',files:[file]},verification:{projectId:'p1',versionId:'v1',verifiedAt:'2026-10-10T12:00:00Z',files:[file]},now};
test('expired approved delivery can request fresh R2 check',()=>assert.deepEqual(canRefreshDelivery(args),{allowed:true,requiresR2Recheck:true}));
test('different customer and stale approval are rejected',()=>{
 assert.equal(canRefreshDelivery({...args,owner:'google:bob'}).allowed,false);
 assert.equal(canRefreshDelivery({...args,project:{...args.project,reviews:[{id:'v2',status:'pending'},...args.project.reviews]}}).allowed,false);
});
test('changed ETags cannot silently refresh approval',()=>{
 assert.equal(unchangedR2Snapshot([file],[{...file,etag:'changed'}]),false);
 assert.equal(unchangedR2Snapshot([file],[file]),true);
});
test('missing original verification cannot be self-approved',()=>assert.equal(canRefreshDelivery({...args,verification:null}).allowed,false));
