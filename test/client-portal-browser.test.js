import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../client-portal.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../assets/js/portal.js',import.meta.url),'utf8');
const project={id:'p1',title:'Animated Emote',stage:3,summary:'Creative project',timeline:[],reviews:[{id:'v1',number:1,label:'First preview',status:'approved',url:'https://example.com/preview.png',createdAt:'2026-10-11T00:00:00Z',decidedAt:'2026-10-11T01:00:00Z'}]};
async function setup(handler){
 const dom=new JSDOM(html,{url:'https://obsidianreign.gg/client-portal',runScripts:'outside-only'});
 const calls=[];
 dom.window.fetch=async(url,opts={})=>{
  calls.push({url:String(url),method:opts.method||'GET'});
  if(String(url)==='/api/portal/me')return Response.json({user:{id:'google:alice'}});
  if(String(url)==='/api/portal/projects')return Response.json({projects:[project]});
  return handler(String(url),opts,calls);
 };
 dom.window.eval(script);
 await new Promise(resolve=>setTimeout(resolve,25));
 return {dom,calls};
}
test('approved customer sees delivery action',async()=>{
 const {dom}=await setup(async()=>Response.json({error:'denied'},{status:403}));
 assert.match(dom.window.document.querySelector('#portal-projects').textContent,/View approved files/);
 dom.window.close();
});
test('unauthorized delivery listing does not trigger refresh',async()=>{
 const {dom,calls}=await setup(async()=>Response.json({error:'Access denied.'},{status:403}));
 const button=[...dom.window.document.querySelectorAll('button')].find(x=>x.textContent==='View approved files');
 button.click();await new Promise(resolve=>setTimeout(resolve,25));
 assert.equal(calls.filter(x=>x.url==='/api/portal/delivery-refresh-check').length,0);
 dom.window.close();
});
test('expired verification triggers one same-origin refresh',async()=>{
 const {dom,calls}=await setup(async(url)=>{
  if(url.startsWith('/api/portal/delivery-files'))return calls.filter(x=>x.url.startsWith('/api/portal/delivery-files')).length===1?Response.json({error:'Delivery access denied: fresh_verification_required'},{status:403}):Response.json({files:[{name:'emote.png',mimeType:'image/png',sizeBytes:100}]});
  if(url==='/api/portal/delivery-refresh-check')return Response.json({refreshed:true});
  return Response.json({error:'not found'},{status:404});
 });
 const button=[...dom.window.document.querySelectorAll('button')].find(x=>x.textContent==='View approved files');
 button.click();await new Promise(resolve=>setTimeout(resolve,25));
 assert.equal(calls.filter(x=>x.url==='/api/portal/delivery-refresh-check').length,1);
 assert.match(dom.window.document.querySelector('#portal-projects').textContent,/Download emote.png/);
 dom.window.close();
});
