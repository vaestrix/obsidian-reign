import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('customer approvals endpoint is admin authenticated',()=>{
 const a=portal.indexOf("if (path.startsWith('/admin/')");
 const b=portal.indexOf("if(path === '/api/portal/admin/customer-approvals'");
 const z=portal.indexOf("return json({ error: 'Unknown operation.' }, 404);",a);
 assert.ok(a>=0&&b>a&&b<z);
});
test('approval list derives from authenticated customer review records',()=>{
 assert.match(portal,/project\.reviews\|\|\[\]/);
 assert.match(portal,/v\.status==='approved'&&v\.decidedAt/);
 assert.match(portal,/source:'authenticated_client_portal'/);
});
