import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDeliveryManifest} from '../src/delivery-manifest.js';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('manifest route is behind admin auth',()=>{
 const a=portal.indexOf("if (path.startsWith('/admin/')");
 const b=portal.indexOf("if(path === '/api/portal/admin/delivery-manifest'");
 const z=portal.indexOf("return json({ error: 'Unknown operation.' }, 404);",a);
 assert.ok(a>=0&&b>a&&b<z);
});
test('manifest persistence requires customer and owner approval',()=>{
 assert.match(portal,/currentCustomerApproval\(project,versionId\)/);
 assert.match(portal,/Owner delivery authorization required/);
 assert.match(portal,/Manifest already exists; owner review required for changes/);
});
test('asset paths must match approved project and version',()=>{
 const file={name:'emote.png',mimeType:'image/png',sizeBytes:100,storageKey:'deliveries/other/v1/emote.png'};
 assert.equal(validateDeliveryManifest({projectId:'p1',versionId:'v1',files:[file]}),null);
});
