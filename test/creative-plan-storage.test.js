import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('creative planning endpoints require admin access',()=>{
 const a=portal.indexOf("if (path.startsWith('/admin/')");
 const b=portal.indexOf("if(path === '/api/portal/admin/creative-plan'");
 const z=portal.indexOf("return json({ error: 'Unknown operation.' }, 404);",a);
 assert.ok(a>=0&&b>a&&b<z);
});
test('plans require existing project and Vesper-Savannah relationship',()=>{
 assert.match(portal,/if\(!await store\.get\('project:'\+projectId\)\)return \{error:'Project not found\.'/);
 assert.match(portal,/plan\.producer!=='vesper'\|\|plan\.customerContact!=='savannah'/);
});
test('creative plan remains non-executing',()=>{
 assert.match(portal,/plan\.status!=='planning_only'/);
});
