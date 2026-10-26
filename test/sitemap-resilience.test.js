import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
for (const [name,fetch] of Object.entries({unavailable:async()=>new Response('',{status:503}),invalid:async()=>Response.json({items:null}),exception:async()=>{throw Error('offline');},healthy:async()=>Response.json({items:[]})})) {
 test('sitemap GET and HEAD survive '+name+' portfolio storage',async()=>{
  const env={PROJECT_HUB:{idFromName:x=>x,get:()=>({fetch})}};
  for(const method of ['GET','HEAD']) {const r=await worker.fetch(new Request('https://obsidianreign.gg/sitemap.xml',{method}),env);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/application\/xml/);const body=await r.text();if(method==='HEAD')assert.equal(body,'');else assert.match(body,/https:\/\/obsidianreign.gg\/services\/creator-websites/);}
  if(name!=='healthy')assert.equal((await worker.fetch(new Request('https://obsidianreign.gg/portfolio'),env)).status,503);
 });
}
