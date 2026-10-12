import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('read-only refresh endpoint is behind client session',()=>{
 const auth=portal.indexOf("if (!user) return json({ error: 'Sign in to view your projects.' }");
 const route=portal.indexOf("if(path === '/api/portal/delivery-refresh-check'");
 assert.ok(auth>=0&&route>auth);
});
test('refresh precheck compares live private R2 metadata with approved snapshot',()=>{
 assert.match(portal,/verifyDeliveryFiles\(env\.DELIVERY_BUCKET,state\.manifest\)/);
 assert.match(portal,/unchangedR2Snapshot\(state\.verification\.files,checked\.files\)/);
});
test('refresh only commits after R2 identity comparison',()=>{
 assert.match(portal,/delivery-refresh-commit/);
 assert.match(portal,/prior\.verifiedAt!==previousVerifiedAt/);
 assert.match(portal,/unchangedR2Snapshot\(prior\.files,files\)/);
});

test('fresh verification avoids redundant R2 calls',()=>{
 const start=portal.indexOf("if(path === '/api/portal/delivery-refresh-check'");
 const end=portal.indexOf("if(path === '/api/portal/delivery-download'",start);
 const route=portal.slice(start,end);
 const early=route.indexOf('if(!decision.requiresR2Recheck)');
 const r2=route.indexOf('verifyDeliveryFiles(env.DELIVERY_BUCKET,state.manifest)');
 assert.ok(early>=0&&r2>early);
 assert.match(route,/stillFresh:true/);
});
