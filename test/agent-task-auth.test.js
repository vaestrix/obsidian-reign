import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('internal task routes require scoped authentication',()=>{
 for(const route of ['/api/portal/internal/agent-tasks','/api/portal/internal/agent-task-status']){
  const start=portal.indexOf("if (path === '"+route+"')");assert.ok(start>=0);
  assert.match(portal.slice(start,start+550),/authenticateAgent\(request,env\)/);
 }
});
test('task queries filter by authenticated assignee',()=>{
 assert.match(portal,/t\.assignedTo===agent/);
 assert.match(portal,/task\.assignedTo!==data\.actor/);
});
test('agents cannot close or cancel tasks through their endpoint',()=>{
 assert.match(portal,/\['in_progress','blocked','ready_for_review'\]\.includes\(status\)/);
});
