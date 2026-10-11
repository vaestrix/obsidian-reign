import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
const a=portal.indexOf("if(path === '/api/portal/delivery-refresh-check' && request.method === 'POST')");
const b=portal.indexOf("if(path === '/api/portal/delivery-download'",a);
const route=portal.slice(a,b);
test('delivery refresh requires exact same-origin browser request',()=>{
 assert.ok(a>=0&&b>a);
 assert.match(route,/origin!==url\.origin/);
 assert.match(route,/Same-origin request required/);
});
test('delivery refresh rejects cross-site fetch metadata',()=>{
 assert.match(route,/site!=='same-origin'/);
 assert.match(route,/Cross-site request denied/);
});
