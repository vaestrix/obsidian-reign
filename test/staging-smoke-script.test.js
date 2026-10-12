import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const smoke=readFileSync(new URL('../scripts/staging-smoke.js',import.meta.url),'utf8');
test('staging smoke checks are restricted to staging workers.dev hostname',()=>{
 assert.match(smoke,/hostname\.endsWith\('\.workers\.dev'\)/);
 assert.match(smoke,/hostname\.startsWith\('obsidian-reign-staging\.'\)/);
});
test('smoke tests only exercise unauthenticated denial paths',()=>{
 assert.match(smoke,/unauthenticated file listing/);
 assert.match(smoke,/unauthenticated file download/);
 assert.match(smoke,/unauthenticated refresh/);
 assert.match(smoke,/agent task access without token/);
 assert.doesNotMatch(smoke,/\/api\/portal\/admin\/generation-approval/);
});
