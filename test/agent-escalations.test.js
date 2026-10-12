import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('owner-only escalation endpoints remain inside admin boundary',()=>{
 const admin=portal.indexOf("if (path.startsWith('/admin/')");
 const escalation=portal.indexOf("if(path === '/api/portal/admin/agent-escalations'");
 const unknown=portal.indexOf("return json({ error: 'Unknown operation.' }, 404);",admin);
 assert.ok(admin>=0 && escalation>admin && escalation<unknown);
});
test('only Savannah and Vesper may submit escalation records',()=>{
 assert.match(portal,/\['savannah','vesper'\]\.includes\(reporter\)/);
 assert.match(portal,/\['savannah','vesper'\]\.includes\(data\.reporter\)/);
});
test('escalation resolution is one-way and recorded',()=>{
 assert.match(portal,/escalation\.status!=='open'/);
 assert.match(portal,/escalation\.resolvedAt=new Date\(now\)\.toISOString\(\)/);
});
