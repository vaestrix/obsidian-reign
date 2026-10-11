import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../assets/js/portal.js',import.meta.url),'utf8');
const helper=readFileSync(new URL('../assets/js/client-delivery.js',import.meta.url),'utf8');
test('client portal only offers delivery UI after latest approval',()=>{
 assert.match(script,/p\.reviews\?\.\[0\]\?\.status==='approved'/);
 assert.match(script,/showApprovedDownloads\(p,files,button,status\)/);
});
test('download interface uses authenticated portal metadata and same-origin refresh',()=>{
 assert.match(script,/\/api\/portal\/delivery-files\?/);
 assert.match(script,/\/api\/portal\/delivery-refresh-check/);
 assert.match(script,/credentials:'same-origin'/);
});
test('browser helper is bundled and uses a single retry after refresh',()=>{
 assert.match(script,/import\('\/assets\/js\/client-delivery\.js'\)/);
 assert.match(helper,/export async function downloadApprovedAsset/);
 assert.match(helper,/refreshRequired===true/);
});
