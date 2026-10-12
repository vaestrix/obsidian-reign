import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('provider state changes require owner authentication',()=>{
 const a=portal.indexOf("if (path.startsWith('/admin/')");
 const b=portal.indexOf("if(path === '/api/portal/admin/generation-provider-state'");
 const z=portal.indexOf("return json({ error: 'Unknown operation.' }, 404);",a);
 assert.ok(a>=0&&b>a&&b<z);
});
test('provider transitions are constrained and preserve job identity',()=>{
 assert.match(portal,/approved_not_submitted:\['submission_uncertain','submitted'\]/);
 assert.match(portal,/submission_uncertain:\['submitted','failed'\]/);
 assert.match(portal,/Provider job ID mismatch/);
 assert.match(portal,/Provider job ID required/);
});
test('terminal provider states do not permit further transitions',()=>{
 assert.match(portal,/completed:\[\],failed:\[\],rejected:\[\]/);
});
