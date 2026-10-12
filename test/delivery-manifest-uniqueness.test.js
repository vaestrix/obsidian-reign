import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDeliveryManifest} from '../src/delivery-manifest.js';
const a={name:'emote.png',mimeType:'image/png',sizeBytes:123,storageKey:'deliveries/p1/v1/emote.png'};
const b={name:'alert.webm',mimeType:'video/webm',sizeBytes:456,storageKey:'deliveries/p1/v1/alert.webm'};
const make=files=>validateDeliveryManifest({projectId:'p1',versionId:'v1',files});
test('distinct delivery assets remain valid',()=>assert.equal(make([a,b]).files.length,2));
test('duplicate filenames are rejected even when storage keys differ',()=>{
 assert.equal(make([a,{...b,name:'emote.png'}]),null);
});
test('duplicate storage keys are rejected even when filenames differ',()=>{
 assert.equal(make([a,{...b,storageKey:a.storageKey}]),null);
});
test('cross-project and cross-version keys are rejected',()=>{
 assert.equal(make([{...a,storageKey:'deliveries/p2/v1/emote.png'}]),null);
 assert.equal(make([{...a,storageKey:'deliveries/p1/v2/emote.png'}]),null);
});
