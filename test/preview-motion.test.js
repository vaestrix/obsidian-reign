import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {JSDOM} from 'jsdom';
const script=await readFile(new URL('../assets/js/preview-motion.js',import.meta.url),'utf8');
async function setup(reduced=false){
 const dom=new JSDOM('<section id="panel"><video><source src="/assets/video/one.mp4"></video></section><video data-feature-video src="/assets/video/savannah.mp4"></video>',{url:'https://obsidianreign.gg',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,v=w.document.querySelector('video'),panel=w.document.querySelector('section');let callback,near,paused=true,plays=0;
 w.fetch=async()=>({ok:true,json:async()=>({'/assets/video/one.mp4':'/assets/video/loops/one.mp4','/assets/video/two.mp4':'/assets/video/loops/two.mp4'})});w.matchMedia=()=>({matches:reduced,addEventListener(){}});w.IntersectionObserver=class{constructor(cb,options){if(options?.rootMargin==='400px 0px')near=cb;else if(!options?.rootMargin)callback=cb;}observe(){}};
 v.getClientRects=()=>panel.hidden?[]:[{}];Object.defineProperty(v,'paused',{get:()=>paused});Object.defineProperty(v,'readyState',{get:()=>4});v.load=()=>{v.dispatchEvent(new w.Event('loadeddata'));};v.play=()=>{plays++;paused=false;v.dispatchEvent(new w.Event('play'));return Promise.resolve();};v.pause=()=>{paused=true;v.dispatchEvent(new w.Event('pause'));};
 await w.eval(script);return{dom,w,v,panel,plays:()=>plays,near:()=>near([{target:v,isIntersecting:true,intersectionRatio:0}]),enter:()=>callback([{target:v,isIntersecting:true,intersectionRatio:.8}]),leave:()=>callback([{target:v,isIntersecting:false,intersectionRatio:0}])};
}
test('public previews use smooth assets and play silently only in view',async()=>{
 const q=await setup();assert.equal(q.v.querySelector('source').hasAttribute('src'),false);assert.equal(q.plays(),0);q.near();assert.match(q.v.querySelector('source').src,/loops\/one.mp4$/);assert.equal(q.plays(),0);q.enter();assert.equal(q.v.paused,false);assert.equal(q.v.muted,true);assert.equal(q.v.loop,true);assert.equal(q.v.playsInline,true);q.v.muted=false;q.leave();assert.equal(q.v.paused,true);assert.equal(q.v.muted,true);q.dom.window.close();
});
test('manual pause is respected but choosing a different source starts a new muted preview',async()=>{
 const q=await setup();q.enter();q.v.dispatchEvent(new q.w.Event('pointerdown'));q.v.pause();q.leave();q.enter();assert.equal(q.plays(),1);q.v.src='/assets/video/two.mp4';await new Promise(r=>setTimeout(r,0));assert.match(q.v.src,/loops\/two.mp4$/);assert.equal(q.v.paused,false);assert.equal(q.v.muted,true);q.dom.window.close();
});
test('hidden panels and reduced-motion preferences do not autoplay',async()=>{
 const q=await setup();q.panel.hidden=true;q.enter();assert.equal(q.plays(),0);q.dom.window.close();const r=await setup(true);r.enter();assert.equal(r.plays(),0);r.dom.window.close();
});
test('Savannah remains controlled by her dedicated sound and playback controls',async()=>{
 const q=await setup();const ad=q.w.document.querySelector('[data-feature-video]');assert.equal(ad.hasAttribute('loop'),false);assert.match(ad.src,/savannah.mp4$/);q.dom.window.close();
});
test('a loading pause during source replacement does not become a visitor pause',async()=>{
 const q=await setup();q.enter();q.v.load=()=>{q.v.pause();q.v.dispatchEvent(new q.w.Event('loadeddata'));};q.v.src='/assets/video/two.mp4';await new Promise(r=>setTimeout(r,0));assert.equal(q.v.paused,false);assert.equal(q.v.muted,true);q.dom.window.close();
});

test('nearby loading respects reduced motion and data saving; manual playback still works',async()=>{
 const q=await setup(true);q.near();assert.equal(q.v.querySelector('source').hasAttribute('src'),false);q.v.dispatchEvent(new q.w.Event('pointerdown'));assert.match(q.v.querySelector('source').src,/loops\/one.mp4$/);q.dom.window.close();
 const r=await setup();Object.defineProperty(r.w.navigator,'connection',{value:{saveData:true}});r.near();r.enter();assert.equal(r.v.querySelector('source').hasAttribute('src'),false);assert.equal(r.plays(),0);r.dom.window.close();
});
