import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('rendered alert stays behind the age prompt and starts only on request', async () => {
  const html=await readFile(new URL('../after-dark.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{runScripts:'dangerously'});
  dom.window.scrollTo=()=>{};
  const doc=dom.window.document,videos=[...doc.querySelectorAll('video')];
  assert.equal(videos.length,2);
  assert.equal(doc.getElementById('content').hidden,true);
  assert.equal(doc.getElementById('age-gate').hidden,false);
  doc.getElementById('enter').click();
  assert.equal(doc.getElementById('content').hidden,false);
  assert.equal(doc.getElementById('age-gate').hidden,true);
  for(const video of videos){
    assert.equal(video.autoplay,false);
    assert.equal(video.loop,false);
    assert.equal(video.preload,'none');
    assert(video.controls);
    for(const path of [video.querySelector('source').getAttribute('src'),video.getAttribute('poster')]){
      assert(path.startsWith('/assets/'));
      assert((await stat(new URL('..'+path,import.meta.url))).size>0);
    }
  }
  dom.window.close();
});

test('production config preserves integrated agents and disables Savannah auto-send',async()=>{
  const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
  assert.equal(config.vars.SAVANNAH_AUTO_SEND,'false');
  assert.equal(config.keep_vars,true);
  assert.equal(config.main,'src/worker.js');
});

test('showcase switches artwork without autoplay and pauses inactive previews', async () => {
  const html=await readFile(new URL('../after-dark.html',import.meta.url),'utf8');
  const script=await readFile(new URL('../assets/js/after-dark-showcase.js',import.meta.url),'utf8');
  const dom=new JSDOM(html,{runScripts:'dangerously'});
  const doc=dom.window.document;
  const states=new Map();
  for(const video of doc.querySelectorAll('video')){
    const state={paused:true,plays:0,pauses:0};states.set(video,state);
    Object.defineProperty(video,'paused',{get:()=>state.paused});
    video.play=async()=>{state.plays++;state.paused=false;video.dispatchEvent(new dom.window.Event('play'));};
    video.pause=()=>{state.pauses++;state.paused=true;video.dispatchEvent(new dom.window.Event('pause'));};
  }
  dom.window.eval(script);
  const button=doc.querySelector('[data-asset-play]');
  const scene=doc.querySelector('[data-asset-panel="scene"] video');
  const alert=doc.querySelector('[data-asset-panel="alert"] video');
  assert.equal(states.get(scene).plays,0);
  button.click();await Promise.resolve();
  assert.equal(states.get(scene).plays,1);
  assert.match(button.textContent,/Pause/);
  doc.querySelector('[data-asset-option="alert"]').click();
  assert.equal(states.get(scene).paused,true);
  assert.equal(states.get(alert).plays,0);
  assert.equal(doc.querySelector('[data-asset-panel="alert"]').hidden,false);
  assert.equal(doc.querySelector('[data-asset-panel="scene"]').hidden,true);
  button.click();await Promise.resolve();assert.equal(states.get(alert).plays,1);
  doc.querySelector('[data-asset-option="camera"]').click();
  assert.equal(states.get(alert).paused,true);
  assert.equal(button.hidden,true);
  const camera=doc.querySelector('[data-asset-panel="camera"]');
  assert.equal(camera.hidden,false);
  assert((await stat(new URL('..'+camera.querySelector('img').getAttribute('src'),import.meta.url))).size>0);
  assert.equal(doc.querySelectorAll('[data-asset-option][aria-pressed="true"]').length,1);
  dom.window.close();
});

test('switching previews during a pending play request cannot restart hidden footage',async()=>{
  const html=await readFile(new URL('../after-dark.html',import.meta.url),'utf8');
  const script=await readFile(new URL('../assets/js/after-dark-showcase.js',import.meta.url),'utf8');
  const dom=new JSDOM(html,{runScripts:'dangerously'}),doc=dom.window.document;
  let complete,pauses=0;
  for(const video of doc.querySelectorAll('video')){video.pause=()=>{pauses++;};video.play=()=>new Promise(resolve=>{complete=resolve;});}
  dom.window.eval(script);
  doc.querySelector('[data-asset-play]').click();
  doc.querySelector('[data-asset-option="camera"]').click();
  const before=pauses;complete();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(pauses,before+1);
  assert.equal(doc.querySelector('[data-asset-panel="camera"]').hidden,false);
  dom.window.close();
});
