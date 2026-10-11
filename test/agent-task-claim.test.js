import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('task claim endpoint authenticates scoped agent',()=>{
 const start=portal.indexOf("if (path === '/api/portal/internal/agent-task-claim')");
 assert.ok(start>=0);assert.match(portal.slice(start,start+600),/authenticateAgent\(request,env\)/);
});
test('claims require correct assignee and queued state',()=>{
 assert.match(portal,/task\.assignedTo!==agent/);
 assert.match(portal,/task\.status!=='queued'/);
 assert.match(portal,/task\.attempts>3/);
});
test('claim and task mutation run inside Durable Object transaction',()=>{
 assert.ok(portal.indexOf("if(operation==='agent-task-claim')")>portal.indexOf('this.ctx.storage.transaction(async store =>'));
});
