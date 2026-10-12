import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/deploy-staging-manual.yml',import.meta.url),'utf8');
test('manual staging deploy checks bucket in configured Cloudflare account first',()=>{
 const check=workflow.indexOf('Confirm private staging R2 bucket exists');
 const deploy=workflow.indexOf('Deploy staging Worker only');
 assert.ok(check>=0&&deploy>check);
 assert.match(workflow,/accounts\/\$\{CLOUDFLARE_ACCOUNT_ID\}\/r2\/buckets\/obsidian-reign-delivery-staging/);
 assert.match(workflow,/j\.result\?\.name!=='obsidian-reign-delivery-staging'/);
});
