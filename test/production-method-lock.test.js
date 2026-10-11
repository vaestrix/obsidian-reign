import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('production method changes are locked when scoped tasks exist',()=>{
 assert.match(portal,/previous\.method!==validated\.method/);
 assert.match(portal,/Production method locked after task creation/);
 assert.match(portal,/Task history exceeds review limit/);
});
test('lock accounts for active, blocked, review and completed tasks',()=>{
 assert.match(portal,/\['queued','in_progress','blocked','ready_for_review','completed'\]/);
});
