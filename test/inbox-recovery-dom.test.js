import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {JSDOM} from 'jsdom';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
test('admin recovery control reports errors, permits retry and calls only the private recovery endpoint',async()=>{
 const html=await readFile(new URL('../project-admin.html',import.meta.url),'utf8'),script=await readFile(new URL('../assets/js/portal.js',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://obsidianreign.gg/admin/projects',runScripts:'outside-only'});let requests=0,fail=true;
 dom.window.fetch=async url=>{if(url==='/api/portal/admin/projects')return {ok:true,json:async()=>({projects:[]})};assert.equal(url,'/api/portal/admin/inbox/recover');requests++;return {ok:!fail,json:async()=>fail?{error:'Inbox unavailable'}:{queued:2,duplicates:1,remaining:0,historyLimited:false}};};
 dom.window.eval(script);await tick();const button=dom.window.document.querySelector('#recover-inbox'),status=dom.window.document.querySelector('#inbox-recovery-status');button.click();await tick();assert.equal(status.textContent,'Inbox unavailable');assert.equal(button.disabled,false);fail=false;button.click();await tick();assert.match(status.textContent,/2 queued for owner review/);assert.match(status.textContent,/No customer reply was sent by recovery/);assert.equal(requests,2);assert.equal(button.disabled,false);dom.window.close();
});
