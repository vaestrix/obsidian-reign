import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('client delivery metadata route occurs after client session requirement',()=>{
 const auth=portal.indexOf("if (!user) return json({ error: 'Sign in to view your projects.' }");
 const route=portal.indexOf("if(path === '/api/portal/delivery-files'");
 assert.ok(auth>=0&&route>auth);
});
test('client delivery manifest checks ownership and approval',()=>{
 assert.match(portal,/project\.owner!==owner/);
 assert.match(portal,/Current approval required/);
 assert.match(portal,/Delivery not authorized/);
});
test('client metadata excludes R2 storage keys',()=>{
 assert.match(portal,/manifest\.files\.map\(f=>\(\{name:f\.name,mimeType:f\.mimeType,sizeBytes:f\.sizeBytes\}\)\)/);
});
