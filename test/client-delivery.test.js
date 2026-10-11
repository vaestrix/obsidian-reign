import test from 'node:test';
import assert from 'node:assert/strict';
import {downloadApprovedAsset} from '../src/client-delivery.js';
const ok=new Response('file',{status:200});
test('normal download uses one authenticated GET',async()=>{
 const calls=[];const fetcher=async(url,opts)=>{calls.push({url,opts});return ok;};
 assert.equal(await downloadApprovedAsset({projectId:'p1',versionId:'v1',fileName:'a.png',fetcher}),ok);
 assert.equal(calls.length,1);assert.equal(calls[0].opts.credentials,'same-origin');
});
test('expired verification uses POST then retries download once',async()=>{
 const calls=[];const fetcher=async(url,opts)=>{calls.push({url,opts});return calls.length===1?Response.json({refreshRequired:true},{status:409}):calls.length===2?Response.json({refreshed:true}):ok;};
 await downloadApprovedAsset({projectId:'p1',versionId:'v1',fileName:'a.png',fetcher});
 assert.deepEqual(calls.map(x=>x.opts.method),['GET','POST','GET']);
 assert.equal(calls[1].opts.credentials,'same-origin');
});
test('unrelated 409 does not trigger refresh',async()=>{
 const calls=[];const fetcher=async(url,opts)=>{calls.push(opts.method);return Response.json({error:'other'},{status:409});};
 await assert.rejects(downloadApprovedAsset({projectId:'p1',versionId:'v1',fileName:'a.png',fetcher}));
 assert.deepEqual(calls,['GET']);
});
test('failed refresh never retries the download',async()=>{
 const calls=[];const fetcher=async(url,opts)=>{calls.push(opts.method);return calls.length===1?Response.json({refreshRequired:true},{status:409}):Response.json({error:'denied'},{status:403});};
 await assert.rejects(downloadApprovedAsset({projectId:'p1',versionId:'v1',fileName:'a.png',fetcher}));
 assert.deepEqual(calls,['GET','POST']);
});
