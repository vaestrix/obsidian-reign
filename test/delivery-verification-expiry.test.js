import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('customer file access expires stale R2 verification',()=>{
 assert.match(portal,/Date\.now\(\)-Date\.parse\(verified\.verifiedAt\)>15\*60\*1000/);
 assert.match(portal,/File verification expired\. Owner must reverify\./);
});
test('customer file listing requires fresh verification',()=>{
 assert.match(portal,/Date\.now\(\)-Date\.parse\(verification\.verifiedAt\)>15\*60\*1000/);
 assert.match(portal,/Fresh file verification required/);
});
