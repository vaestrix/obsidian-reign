import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const staging=JSON.parse(readFileSync(new URL('../wrangler.staging.jsonc',import.meta.url),'utf8'));
const production=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
test('staging delivery bucket is isolated from production',()=>{
 assert.equal(staging.name,'obsidian-reign-staging');
 assert.equal(staging.r2_buckets?.[0]?.binding,'DELIVERY_BUCKET');
 assert.equal(staging.r2_buckets?.[0]?.bucket_name,'obsidian-reign-delivery-staging');
 assert.equal(production.r2_buckets?.some(x=>x.bucket_name==='obsidian-reign-delivery-staging')??false,false);
});
test('staging customer email automation stays disabled',()=>{
 assert.equal(staging.vars.STAGING,'true');
 assert.equal(staging.vars.SAVANNAH_AUTO_SEND,'false');
});
