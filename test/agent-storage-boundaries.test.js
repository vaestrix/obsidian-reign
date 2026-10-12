import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('internal messaging and task endpoints are inside admin auth branch',()=>{
 const admin=portal.indexOf("if (path.startsWith('/admin/')");
 const task=portal.indexOf("if(path === '/api/portal/admin/agent-tasks'");
 const msg=portal.indexOf("if(path === '/api/portal/admin/agent-messages'");
 const unknown=portal.indexOf("return json({ error: 'Unknown operation.' }, 404);",admin);
 assert.ok(admin>=0 && task>admin && msg>admin && task<unknown && msg<unknown);
});
test('task storage requires a real project and checks expected status',()=>{
 assert.match(portal,/if\(!await store\.get\('project:'\+projectId\)\)return \{error:'Project not found\.'/);
 assert.match(portal,/task\.status!==data\.expectedStatus/);
 assert.match(portal,/completed:\[\],cancelled:\[\]/);
});
test('internal messages enforce communication policy on both sides',()=>{
 assert.match(portal,/authorizeAgentMessage\(\{from,to,channel:'internal'\}\)/);
 assert.match(portal,/authorizeAgentMessage\(\{from:data\.from,to:data\.to,channel:'internal'\}\)/);
});
