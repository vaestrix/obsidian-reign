import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('owner alerts require admin authentication',()=>{
 const start=portal.indexOf("if (path.startsWith('/admin/')");
 const alert=portal.indexOf("if(path === '/api/portal/admin/agent-alerts'");
 const end=portal.indexOf("return json({ error: 'Unknown operation.' }, 404);",start);
 assert.ok(start>=0&&alert>start&&alert<end);
});
test('owner alerts only show unresolved high and critical issues',()=>{
 assert.match(portal,/x\.status==='open'&&\['high','critical'\]\.includes\(x\.severity\)/);
 assert.match(portal,/delivery:'dashboard_only'/);
});
