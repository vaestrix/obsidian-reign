import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('generation reservations are behind admin authentication',()=>{
 const a=portal.indexOf("if (path.startsWith('/admin/')");
 const b=portal.indexOf("if(path === '/api/portal/admin/generation-reservations'");
 const z=portal.indexOf("return json({ error: 'Unknown operation.' }, 404);",a);
 assert.ok(a>=0&&b>a&&b<z);
});
test('reservation requires active Vesper task and deduplicates request keys',()=>{
 assert.match(portal,/task\.assignedTo!=='vesper'\|\|task\.status!=='in_progress'/);
 assert.match(portal,/generation-reservation:'\+projectId\+':'\+requestKey/);
 assert.match(portal,/Idempotency key conflict/);
});
test('reservation does not trigger external generation',()=>{
 assert.match(portal,/status:'pending_owner_approval',providerJobId:null/);
});
