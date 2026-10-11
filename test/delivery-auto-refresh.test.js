import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
const start=portal.indexOf("if(path === '/api/portal/delivery-download' && request.method === 'GET')");
const end=portal.indexOf("if(path === '/api/portal/delivery-files' && request.method === 'GET')",start);
const route=portal.slice(start,end);
test('GET downloads never mutate verification records',()=>{
 assert.ok(start>=0&&end>start);
 assert.doesNotMatch(route,/delivery-refresh-commit/);
 assert.doesNotMatch(route,/verifyDeliveryFiles/);
});
test('expired downloads require authenticated POST refresh',()=>{
 assert.match(route,/refreshRequired:true/);
 assert.match(portal,/if\(path === '\/api\/portal\/delivery-refresh-check'/);
});
