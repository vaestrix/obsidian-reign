import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('production method can only be saved by an authenticated admin',()=>{
 const start=portal.indexOf("if (path.startsWith('/admin/')");
 const route=portal.indexOf("if(path === '/api/portal/admin/production-method'");
 const end=portal.indexOf("return json({ error: 'Unknown operation.' }, 404);",start);
 assert.ok(start>=0&&route>start&&route<end);
});
test('Vesper task creation checks production method authorization',()=>{
 const start=portal.indexOf("if(operation==='creative-task-create')");
 const end=portal.indexOf("if(operation==='creative-plan-save'",start);
 const block=portal.slice(start,end);
 assert.match(block,/authorizeProductionMethod\(productionMethod\)/);
 assert.match(block,/if\(!readiness\.allowed\)return/);
 assert.match(block,/productionMethod:productionMethod\.method/);
});
