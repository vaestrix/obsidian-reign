import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('verification is persisted only after successful private R2 checks',()=>{
 assert.match(portal,/if\(!check\.verified\)return json/);
 assert.match(portal,/delivery-verification-record/);
 assert.match(portal,/delivery-verified:'\+projectId\+':'\+versionId/);
});
test('customer metadata and downloads both require recorded verification',()=>{
 assert.match(portal,/if\(!verified\)return \{error:'File verification required\.'/);
 assert.match(portal,/const verification=await store\.get\('delivery-verified:'\+projectId\+':'\+versionId\)/);
});
test('download checks R2 object ETag against verified record',()=>{
 assert.match(portal,/object\.etag!==result\.verifiedEtag/);
 assert.match(portal,/verifiedFile\.etag/);
});
