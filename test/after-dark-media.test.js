import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('rendered alert stays behind the age prompt and starts only on request', async () => {
  const html=await readFile(new URL('../after-dark.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{runScripts:'dangerously'});
  dom.window.scrollTo=()=>{};
  const doc=dom.window.document,videos=[...doc.querySelectorAll('video')];
  assert.equal(videos.length,7);
  assert.equal(doc.getElementById('content').hidden,true);
  assert.equal(doc.getElementById('age-gate').hidden,false);
  doc.getElementById('enter').click();
  assert.equal(doc.getElementById('content').hidden,false);
  assert.equal(doc.getElementById('age-gate').hidden,true);
  for(const video of videos){
    assert.equal(video.autoplay,false);
    assert.equal(video.loop,['scene','break','ending'].includes(video.closest('[data-asset-panel]').dataset.assetPanel));
    assert.equal(video.preload,'none');
    assert(video.controls);
    for(const path of [video.querySelector('source').getAttribute('src'),video.getAttribute('poster')]){
      assert(path.startsWith('/assets/'));
      assert((await stat(new URL('..'+path,import.meta.url))).size>0);
    }
  }
  dom.window.close();
});

test('deploy preserves the owner-managed Savannah switch and keeps previews paused',async()=>{
  const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
  assert.equal(Object.hasOwn(config.vars,'SAVANNAH_AUTO_SEND'),false);
  assert.equal(config.vars.ANNA_AUTO_SEND,'false');
  assert.equal(config.vars.ANNA_POSTAL_ADDRESS_CONFIRMED,'false');
  assert.equal(config.vars.ANNA_OUTREACH_VERIFIED,'false');
  assert.equal(config.vars.AGENTS_START_AT,'2026-10-24T05:00:00Z');
  assert.equal(config.previews.vars.SAVANNAH_AUTO_SEND,'false');
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
  const suite=doc.querySelector('[aria-labelledby=demo-title] [data-after-dark-suite]');
  const button=suite.querySelector('[data-asset-play]');
  const scene=suite.querySelector('[data-asset-panel="scene"] video');
  const alert=suite.querySelector('[data-asset-panel="alert"] video');
  assert.equal(states.get(scene).plays,0);
  button.click();await Promise.resolve();
  assert.equal(states.get(scene).plays,1);
  assert.match(button.textContent,/Pause/);
  suite.querySelector('[data-asset-option="alert"]').click();
  assert.equal(states.get(scene).paused,true);
  assert.equal(states.get(alert).plays,0);
  assert.equal(suite.querySelector('[data-asset-panel="alert"]').hidden,false);
  assert.equal(suite.querySelector('[data-asset-panel="scene"]').hidden,true);
  button.click();await Promise.resolve();assert.equal(states.get(alert).plays,1);
  suite.querySelector('[data-asset-option="camera"]').click();
  assert.equal(states.get(alert).paused,true);
  assert.equal(button.hidden,true);
  const camera=suite.querySelector('[data-asset-panel="camera"]');
  assert.equal(camera.hidden,false);
  assert((await stat(new URL('..'+camera.querySelector('img').getAttribute('src'),import.meta.url))).size>0);
  assert.equal(suite.querySelectorAll('[data-asset-option][aria-pressed="true"]').length,1);
  suite.querySelector('[data-asset-option="overlay"]').click();
  const overlay=suite.querySelector('[data-asset-panel="overlay"]');
  assert.equal(overlay.hidden,false);
  assert.equal(button.hidden,false);
  assert.equal(states.get(overlay.querySelector('video')).plays,0);
  assert.equal(overlay.querySelector('video source').type,'video/webm');
  assert.equal(suite.querySelector('[data-asset-panel="camera"]').hidden,true);
  const overlayVideo=overlay.querySelector('video');
  overlayVideo.dispatchEvent(new dom.window.Event('error'));
  assert.equal(overlayVideo.hidden,true);
  assert.equal(overlay.querySelector('[data-asset-fallback]').hidden,false);
  assert.equal(button.hidden,true);
  suite.querySelector('[data-asset-option="camera"]').click();
  suite.querySelector('[data-asset-option="overlay"]').click();
  assert.equal(button.hidden,true);
  assert.match(suite.querySelector('.ad-preview-caption [data-asset-caption]').textContent,/Motion preview is unavailable/);
  dom.window.close();
});

test('switching previews during a pending play request cannot restart hidden footage',async()=>{
  const html=await readFile(new URL('../after-dark.html',import.meta.url),'utf8');
  const script=await readFile(new URL('../assets/js/after-dark-showcase.js',import.meta.url),'utf8');
  const dom=new JSDOM(html,{runScripts:'dangerously'}),doc=dom.window.document;
  let complete,pauses=0;
  for(const video of doc.querySelectorAll('video')){video.pause=()=>{pauses++;};video.play=()=>new Promise(resolve=>{complete=resolve;});}
  dom.window.eval(script);
  const suite=doc.querySelector('[aria-labelledby=demo-title] [data-after-dark-suite]');
  suite.querySelector('[data-asset-play]').click();
  suite.querySelector('[data-asset-option="camera"]').click();
  const before=pauses;complete();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(pauses,before+1);
  assert.equal(suite.querySelector('[data-asset-panel="camera"]').hidden,false);
  dom.window.close();
});

test('Creator packages lead into independent Velvet Muse and Black Rose collections',async()=>{
  const html=await readFile(new URL('../after-dark.html',import.meta.url),'utf8');
  const script=await readFile(new URL('../assets/js/after-dark-showcase.js',import.meta.url),'utf8');
  const dom=new JSDOM(html,{runScripts:'dangerously'}),doc=dom.window.document;
  for(const video of doc.querySelectorAll('video')){video.pause=()=>{};}
  dom.window.eval(script);
  const suites=[...doc.querySelectorAll('[data-after-dark-suite]')];assert.equal(suites.length,2);
  const [velvet,rose]=suites;
  assert.equal(velvet.closest('section').getAttribute('aria-labelledby'),'velvet-title');
  assert.equal(velvet.querySelector('[data-asset-play]').hidden,false);
  velvet.querySelector('[data-asset-option="alert"]').click();
  assert.equal(velvet.querySelector('[data-asset-panel="alert"]').hidden,false);
  assert.equal(rose.querySelector('[data-asset-panel="scene"]').hidden,false);
  for(const suite of suites)assert.equal(suite.querySelectorAll('[data-asset-option][aria-pressed="true"]').length,1);
  for(const image of velvet.querySelectorAll('img'))assert((await stat(new URL('..'+image.getAttribute('src'),import.meta.url))).size>0);
  assert.match(html,/Custom profile banners, watermarks, social templates and video branding/);
  assert.doesNotMatch(html,/Moonlit Heiress/);
  dom.window.close();
});

test('switching collections cancels a pending play request in the other collection',async()=>{
  const html=await readFile(new URL('../after-dark.html',import.meta.url),'utf8');
  const script=await readFile(new URL('../assets/js/after-dark-showcase.js',import.meta.url),'utf8');
  const dom=new JSDOM(html,{runScripts:'dangerously'}),doc=dom.window.document;
  let complete,pauses=0;
  for(const video of doc.querySelectorAll('video')){video.pause=()=>{pauses++;};video.play=()=>new Promise(resolve=>{complete=resolve;});}
  dom.window.eval(script);
  doc.querySelector('[aria-labelledby="demo-title"] [data-asset-play]').click();
  doc.querySelector('.ad-suite-velvet [data-asset-option="camera"]').click();
  const before=pauses;complete();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(pauses,before+1);
  assert.equal(doc.querySelector('.ad-suite-velvet [data-asset-panel="camera"]').hidden,false);
  dom.window.close();
});

test('starting a different collection pauses the previously playing preview',async()=>{
  const html=await readFile(new URL('../after-dark.html',import.meta.url),'utf8');
  const script=await readFile(new URL('../assets/js/after-dark-showcase.js',import.meta.url),'utf8');
  const dom=new JSDOM(html,{runScripts:'dangerously'}),doc=dom.window.document;
  const states=new Map();
  for(const video of doc.querySelectorAll('video')){
    const state={paused:true};states.set(video,state);
    Object.defineProperty(video,'paused',{get:()=>state.paused});
    video.pause=()=>{state.paused=true;video.dispatchEvent(new dom.window.Event('pause'));};
    video.play=async()=>{state.paused=false;video.dispatchEvent(new dom.window.Event('play'));};
  }
  dom.window.eval(script);
  const rose=doc.querySelector('[aria-labelledby="demo-title"] [data-after-dark-suite]');
  const velvet=doc.querySelector('.ad-suite-velvet');
  rose.querySelector('[data-asset-play]').click();await Promise.resolve();
  const roseVideo=rose.querySelector('[data-asset-panel="scene"] video');
  assert.equal(states.get(roseVideo).paused,false);
  velvet.querySelector('[data-asset-play]').click();await Promise.resolve();
  assert.equal(states.get(roseVideo).paused,true);
  assert.equal(states.get(velvet.querySelector('[data-asset-panel="scene"] video')).paused,false);
  dom.window.close();
});

test('Velvet stream scenes have distinct media and remain selectable behind the age gate',async()=>{
  const html=await readFile(new URL('../after-dark.html',import.meta.url),'utf8');
  const script=await readFile(new URL('../assets/js/after-dark-showcase.js',import.meta.url),'utf8');
  const dom=new JSDOM(html,{runScripts:'dangerously'}),doc=dom.window.document;
  for(const video of doc.querySelectorAll('video'))video.pause=()=>{};
  dom.window.eval(script);
  const suite=doc.querySelector('.ad-suite-velvet'),sources=[],posters=[];
  for(const key of ['scene','break','ending']){
    suite.querySelector(`[data-asset-option="${key}"]`).click();
    const panel=suite.querySelector(`[data-asset-panel="${key}"]`);
    assert.equal(panel.hidden,false);
    assert.equal(suite.querySelectorAll('[data-asset-panel]:not([hidden])').length,1);
    sources.push(panel.querySelector('source').src);posters.push(panel.querySelector('video').poster);
    assert.equal(doc.getElementById('content').hidden,true);
  }
  assert.equal(new Set(sources).size,3);assert.equal(new Set(posters).size,3);
  dom.window.close();
});
