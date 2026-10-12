import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('delivery verification route requires admin authentication',()=>{
 const a=portal.indexOf("if (path.startsWith('/admin/')");
 const b=portal.indexOf("if(path === '/api/portal/admin/delivery-verify'");
 const z=portal.indexOf("return json({ error: 'Unknown operation.' }, 404);",a);
 assert.ok(a>=0&&b>a&&b<z);
});
test('R2 verification uses private binding and fails closed',()=>{
 assert.match(portal,/verifyDeliveryFiles\(env\.DELIVERY_BUCKET,result\.manifest\)/);
 assert.match(portal,/if\(!check\.verified\)return json\(\{verified:false,reason:check\.reason\},409\)/);
});
test('manifest retrieval rechecks current customer and owner authorization',()=>{
 assert.match(portal,/if\(!project\|\|!currentCustomerApproval\(project,versionId\)\)/);
 assert.match(portal,/Owner delivery authorization required/);
});
