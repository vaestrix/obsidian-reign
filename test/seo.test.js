import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {services,servicePage,page} from '../src/public-content.js';
import {concepts,casePage} from '../src/portfolio.js';
import {readFileSync,existsSync} from 'node:fs';

test('public pages have matching canonical and complete social metadata with real local images',()=>{
 const pages=[...services.map(servicePage),...concepts.map(casePage),...['index','services','pricing','start-project'].map(name=>readFileSync(new URL('../'+name+'.html',import.meta.url),'utf8'))];
 const canonical=new Set();
 for(const html of pages){
  const doc=new JSDOM(html).window.document;
  const url=doc.querySelector('link[rel="canonical"]').href;
  assert(!canonical.has(url));canonical.add(url);
  assert.equal(doc.querySelector('meta[property="og:url"]').content,url);
  for(const key of ['title','description','image']){
   const og=doc.querySelector(`meta[property="og:${key}"]`).content;
   const twitter=doc.querySelector(`meta[name="twitter:${key}"]`).content;
   assert(og.length>0);assert(twitter.length>0);
   if(key!=='title')assert.equal(og,twitter);
  }
  assert(doc.querySelector('meta[property="og:site_name"]'));
  const image=doc.querySelector('meta[property="og:image"]').content;
  assert.equal(new URL(image).origin,'https://obsidianreign.gg');
  assert(existsSync(new URL('..'+new URL(image).pathname,import.meta.url)));
 }
});
test('dynamic portfolio metadata escapes editorial content',()=>{
 const doc=new JSDOM(page({title:'Test " ><script>alert(1)</script>',description:'A & B',path:'/work/test',body:'',image:'/assets/img/test.jpg'})).window.document;
 assert.equal(doc.querySelectorAll('script:not([src])').length,0);
 assert.equal(doc.querySelector('meta[name="twitter:description"]').content,'A & B');
});
