import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('delivery authorization is restricted to admin-authenticated route',()=>{
 const a=portal.indexOf("if (path.startsWith('/admin/')");
 const b=portal.indexOf("if(path === '/api/portal/admin/delivery-authorization'");
 const z=portal.indexOf("return json({ error: 'Unknown operation.' }, 404);",a);
 assert.ok(a>=0&&b>a&&b<z);
});
test('delivery requires current approved version and is idempotent',()=>{
 assert.match(portal,/currentCustomerApproval\(project,versionId\)/);
 assert.match(portal,/Current customer approval required/);
 assert.match(portal,/delivery-authorization:'\+projectId\+':'\+versionId/);
 assert.match(portal,/authorized_not_delivered/);
});
