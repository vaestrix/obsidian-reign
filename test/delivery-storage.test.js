import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyDeliveryFiles} from '../src/delivery-storage.js';
const manifest={projectId:'p1',versionId:'v1',files:[{storageKey:'deliveries/p1/v1/emote.png',sizeBytes:42,mimeType:'image/png'}]};
const bucket={head:async key=>({size:42,httpMetadata:{contentType:'image/png'},etag:'abc'})};
test('valid private R2 metadata verifies without public URLs',async()=>{
 const result=await verifyDeliveryFiles(bucket,manifest);
 assert.equal(result.verified,true);assert.equal(result.files[0].etag,'abc');
});
test('missing bucket and objects fail closed',async()=>{
 assert.equal((await verifyDeliveryFiles(null,manifest)).verified,false);
 assert.equal((await verifyDeliveryFiles({head:async()=>null},manifest)).reason,'file_missing');
});
test('mismatched file size or MIME fails closed',async()=>{
 assert.equal((await verifyDeliveryFiles({head:async()=>({size:40,httpMetadata:{contentType:'image/png'}})},manifest)).reason,'size_mismatch');
 assert.equal((await verifyDeliveryFiles({head:async()=>({size:42,httpMetadata:{contentType:'text/html'}})},manifest)).reason,'mime_mismatch');
});
