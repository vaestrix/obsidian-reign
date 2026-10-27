import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const source=await readFile(new URL('../assets/js/studio.js',import.meta.url),'utf8');
function setup(reduced=false){
 const dom=new JSDOM('<video data-feature-video></video><button data-ad-sound>WATCH WITH SOUND</button>',{runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,v=w.document.querySelector('video'),b=w.document.querySelector('button');let observer,paused=true,plays=0;
 w.matchMedia=()=>({matches:reduced,addEventListener(){}});w.IntersectionObserver=class{constructor(cb){observer=cb;}observe(){}};
 Object.defineProperty(v,'paused',{get:()=>paused});v.play=()=>{paused=false;plays++;v.dispatchEvent(new w.Event('play'));return Promise.resolve();};v.pause=()=>{paused=true;v.dispatchEvent(new w.Event('pause'));};
 const normalized=source.replace(/\r\n/g,'\n');w.eval(normalized.slice(normalized.lastIndexOf('(()=>{\n const v=')));
 return {dom,v,b,plays:()=>plays,view:visible=>observer([{isIntersecting:visible,intersectionRatio:visible?.8:0}])};
}
test('ad enters silently, enables sound only on request, and remutes offscreen',async()=>{
 const q=setup();q.view(true);assert.equal(q.plays(),1);assert.equal(q.v.muted,true);assert.equal(q.v.playsInline,true);
 q.v.currentTime=4;q.b.click();await Promise.resolve();assert.equal(q.v.muted,false);assert.equal(q.v.currentTime,0);assert.equal(q.b.textContent,'MUTE SOUND');
 q.view(false);assert.equal(q.v.paused,true);assert.equal(q.v.muted,true);q.view(true);assert.equal(q.v.paused,false);assert.equal(q.v.muted,true);q.dom.window.close();
});
test('a visitor pause survives leaving and returning to view',()=>{
 const q=setup();q.view(true);q.v.pause();q.view(false);q.view(true);assert.equal(q.plays(),1);assert.equal(q.v.paused,true);q.dom.window.close();
});
test('reduced motion skips autoplay while Watch with sound remains usable',async()=>{
 const q=setup(true);q.view(true);assert.equal(q.plays(),0);q.b.click();await Promise.resolve();assert.equal(q.plays(),1);assert.equal(q.v.muted,false);q.dom.window.close();
});
