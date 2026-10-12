import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const portal=readFileSync(new URL('../src/portal.js',import.meta.url),'utf8');
test('delivery route does not accept HEAD',()=>{
 assert.match(portal,/path === '\/api\/portal\/delivery-download' && request\.method === 'HEAD'/);
});
test('download filenames strip leading dots and enforce bounded names',()=>{
 assert.match(portal,/replace\(\/\^\\\.\+\/,'_'\)\.slice\(0,160\)/);
 assert.match(portal,/if\(!safeName\)return json/);
});
