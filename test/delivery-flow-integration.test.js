import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDeliveryManifest} from '../src/delivery-manifest.js';
import {verifyDeliveryFiles} from '../src/delivery-storage.js';
import {authorizeCustomerDelivery} from '../src/delivery-access.js';
import {canRefreshDelivery,unchangedR2Snapshot} from '../src/delivery-refresh.js';
const NOW=Date.parse('2026-10-11T12:00:00Z');
const file={name:'emote.png',mimeType:'image/png',sizeBytes:128,storageKey:'deliveries/project1/version1/emote.png'};
const manifest=validateDeliveryManifest({projectId:'project1',versionId:'version1',files:[file]});
const project={id:'project1',owner:'google:alice',reviews:[{id:'version1',status:'approved',decidedAt:'2026-10-11T10:00:00Z'}]};
const authorization={status:'authorized_not_delivered'};
const bucket=(overrides={})=>({head:async key=>key===file.storageKey?{size:128,httpMetadata:{contentType:'image/png'},etag:'etag1',...overrides}:null});
const context=(verification,overrides={})=>({project,owner:'google:alice',versionId:'version1',authorization,manifest,verification,now:NOW,...overrides});
test('approved owner can access manifest after verified private R2 metadata',async()=>{
 const checked=await verifyDeliveryFiles(bucket(),manifest);
 assert.equal(checked.verified,true);
 const verification={projectId:'project1',versionId:'version1',verifiedAt:'2026-10-11T11:59:00Z',files:checked.files};
 assert.equal(authorizeCustomerDelivery(context(verification)).allowed,true);
});
test('another signed-in customer cannot use the approved delivery',async()=>{
 const checked=await verifyDeliveryFiles(bucket(),manifest);
 const verification={projectId:'project1',versionId:'version1',verifiedAt:'2026-10-11T11:59:00Z',files:checked.files};
 assert.equal(authorizeCustomerDelivery(context(verification,{owner:'google:bob'})).reason,'access_denied');
});
test('changed R2 object cannot renew expired delivery',async()=>{
 const original=await verifyDeliveryFiles(bucket(),manifest);
 const changed=await verifyDeliveryFiles(bucket({etag:'etag2'}),manifest);
 const verification={projectId:'project1',versionId:'version1',verifiedAt:'2026-10-10T12:00:00Z',files:original.files};
 assert.equal(canRefreshDelivery(context(verification)).allowed,true);
 assert.equal(unchangedR2Snapshot(original.files,changed.files),false);
});
test('missing or wrong-type R2 object fails verification',async()=>{
 assert.equal((await verifyDeliveryFiles({head:async()=>null},manifest)).reason,'file_missing');
 assert.equal((await verifyDeliveryFiles(bucket({httpMetadata:{contentType:'text/html'}}),manifest)).reason,'mime_mismatch');
});
test('new unapproved preview invalidates previous approved delivery',async()=>{
 const checked=await verifyDeliveryFiles(bucket(),manifest);
 const verification={projectId:'project1',versionId:'version1',verifiedAt:'2026-10-11T11:59:00Z',files:checked.files};
 const revised={...project,reviews:[{id:'version2',status:'pending'},...project.reviews]};
 assert.equal(authorizeCustomerDelivery(context(verification,{project:revised})).reason,'current_approval_required');
});
