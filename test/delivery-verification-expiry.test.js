import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('customer file access expires stale R2 verification',()=>{
 assert.match(portal,/authorizeCustomerDelivery\(\{project,owner,versionId,authorization,manifest,verification:verified,now\}\)/);
});
test('customer file listing requires fresh verification',()=>{
 assert.match(portal,/authorizeCustomerDelivery\(\{project,owner,versionId,authorization,manifest,verification,now\}\)/);
});
