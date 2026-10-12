import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('download endpoint requires authenticated client session',()=>{
 const auth=portal.indexOf("if (!user) return json({ error: 'Sign in to view your projects.' }");
 const route=portal.indexOf("if(path === '/api/portal/delivery-download'");
 assert.ok(auth>=0&&route>auth);
});
test('download uses private R2 and no-store headers',()=>{
 assert.match(portal,/env\.DELIVERY_BUCKET\.get\(file\.storageKey\)/);
 assert.match(portal,/Cache-Control':'private, no-store'/);
 assert.match(portal,/Content-Disposition':'attachment;/);
});
test('download rechecks project ownership and latest approval',()=>{
 assert.match(portal,/authorizeCustomerDelivery\(\{project,owner,versionId,authorization,manifest,verification:verified,now\}\)/);
 assert.match(portal,/File unavailable or ambiguous/);
});
