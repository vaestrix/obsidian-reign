import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('generation approval endpoint requires admin session',()=>{
 const a=portal.indexOf("if (path.startsWith('/admin/')");
 const b=portal.indexOf("if(path === '/api/portal/admin/generation-approval'");
 const z=portal.indexOf("return json({ error: 'Unknown operation.' }, 404);",a);
 assert.ok(a>=0&&b>a&&b<z);
});
test('approval is single decision and never submits generation',()=>{
 assert.match(portal,/reservation\.status!=='pending_owner_approval'/);
 assert.match(portal,/approved_not_submitted':'rejected'/);
 assert.match(portal,/reservation\.decidedBy='owner'/);
});
