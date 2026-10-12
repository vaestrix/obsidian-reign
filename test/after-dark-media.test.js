import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('rendered alert stays behind the age prompt and starts only on request', async () => {
  const html=await readFile(new URL('../after-dark.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{runScripts:'dangerously'});
  dom.window.scrollTo=()=>{};
  const doc=dom.window.document,video=doc.querySelector('.rendered-alert');
  assert.equal(doc.getElementById('content').hidden,true);
  assert.equal(doc.getElementById('age-gate').hidden,false);
  assert.equal(video.autoplay,false);
  assert.equal(video.loop,false);
  assert.equal(video.preload,'none');
  assert(video.controls);
  doc.getElementById('enter').click();
  assert.equal(doc.getElementById('content').hidden,false);
  assert.equal(doc.getElementById('age-gate').hidden,true);
  for(const path of [video.querySelector('source').getAttribute('src'),video.getAttribute('poster')]){
    assert(path.startsWith('/assets/'));
    assert((await stat(new URL('..'+path,import.meta.url))).size>0);
  }
  dom.window.close();
});

test('production config preserves integrated agents and disables Savannah auto-send',async()=>{
  const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
  assert.equal(config.vars.SAVANNAH_AUTO_SEND,'false');
  assert.equal(config.keep_vars,true);
  assert.equal(config.main,'src/worker.js');
});
