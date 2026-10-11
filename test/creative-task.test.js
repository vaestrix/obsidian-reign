import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('creative task creation is owner-gated',()=>{
 const a=portal.indexOf("if (path.startsWith('/admin/')");
 const b=portal.indexOf("if(path === '/api/portal/admin/creative-task'");
 const z=portal.indexOf("return json({ error: 'Unknown operation.' }, 404);",a);
 assert.ok(a>=0&&b>a&&b<z);
});
test('creative tasks require approval evidence and existing plan',()=>{
 assert.match(portal,/approvalEvidence\.trim\(\)\.length<8/);
 assert.match(portal,/Creative plan not found/);
});
test('creative plan task links prevent duplicate task creation',()=>{
 assert.match(portal,/creative-task-link:'\+projectId\+':'\+planId/);
 assert.match(portal,/if\(existing\)return \{taskId:existing\.taskId,reused:true\}/);
 assert.match(portal,/assignedTo:'vesper'/);
});
