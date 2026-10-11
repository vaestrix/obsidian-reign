import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDeliveryManifest} from '../src/delivery-manifest.js';
const file={name:'emote.png',mimeType:'image/png',sizeBytes:1024,storageKey:'deliveries/p1/v1/emote.png'};
const base={projectId:'p1',versionId:'v1',files:[file]};
test('valid manifest remains pending file verification',()=>{
 assert.equal(validateDeliveryManifest(base).status,'manifest_pending_file_verification');
});
test('unsupported MIME types and unsafe storage paths are rejected',()=>{
 assert.equal(validateDeliveryManifest({...base,files:[{...file,mimeType:'text/html'}]}),null);
 assert.equal(validateDeliveryManifest({...base,files:[{...file,storageKey:'deliveries/p1/../secret'}]}),null);
});
test('empty manifests and invalid sizes are rejected',()=>{
 assert.equal(validateDeliveryManifest({...base,files:[]}),null);
 assert.equal(validateDeliveryManifest({...base,files:[{...file,sizeBytes:0}]}),null);
});
