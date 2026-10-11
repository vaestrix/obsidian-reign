import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
const start=portal.indexOf("if(path === '/api/portal/delivery-download' && request.method === 'GET')");
const end=portal.indexOf("if(path === '/api/portal/delivery-files' && request.method === 'GET')",start);
const route=portal.slice(start,end);
test('expired verification triggers revalidation only for authenticated download',()=>{
 assert.ok(start>=0&&end>start);
 assert.match(route,/result\.error==='Delivery access denied: fresh_verification_required'/);
 assert.match(route,/delivery-refresh-state/);
});
test('revalidation compares original and current R2 identity before committing',()=>{
 assert.match(route,/verifyDeliveryFiles\(env\.DELIVERY_BUCKET,state\.manifest\)/);
 assert.match(route,/unchangedR2Snapshot\(state\.verification\.files,checked\.files\)/);
 assert.match(route,/delivery-refresh-commit/);
});
test('download authorization is checked again after renewal',()=>{
 assert.equal(route.split("'delivery-client-file'").length-1,2);
 assert.match(route,/if\(result\.error\)return json\(result,403\)/);
});
