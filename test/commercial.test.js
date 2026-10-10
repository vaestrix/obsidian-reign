import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
import {ProjectHub,portal,hash} from '../src/portal.js';
import {validateLead,readJson} from '../src/studio.js';
import {validatePortfolio,casePage,concepts} from '../src/portfolio.js';
import {selectedKit,describeKit} from '../assets/js/catalog.js';
import {priceModel} from '../assets/js/pricing-model.js';

function setup(){
 const rows=new Map();let alarm;
 const storage={get:async k=>structuredClone(rows.get(k)),put:async(k,v)=>rows.set(k,structuredClone(v)),delete:async k=>rows.delete(k),list:async({prefix,limit=10000})=>new Map([...rows].filter(([k])=>k.startsWith(prefix)).slice(0,limit).map(([k,v])=>[k,structuredClone(v)])),transaction:async fn=>fn(storage),getAlarm:async()=>alarm,setAlarm:async value=>alarm=value};
 const hub=new ProjectHub({storage});const env={PUBLIC_ORIGIN:'https://obsidianreign.gg',ADMIN_PASSWORD_SHA256:'test-verifier',PROJECT_HUB:{idFromName:x=>x,get:()=>hub},ASSETS:{fetch:async()=>new Response('asset')}};
 const call=async(op,data={})=>(await hub.fetch(new Request('https://hub/'+op,{method:'POST',body:JSON.stringify(data)}))).json();
 const req=(path,data,headers={})=>new Request(env.PUBLIC_ORIGIN+path,{method:data?'POST':'GET',headers:{...(data?{Origin:env.PUBLIC_ORIGIN,'Content-Type':'application/json'}:{}),...headers},body:data?JSON.stringify(data):undefined});
 const admin=async()=>{await call('login',{key:await hash('admin-session'),user:{id:'studio:admin',authVersion:env.ADMIN_PASSWORD_SHA256}});return {Cookie:'__Host-or_admin=admin-session'};};
 return {rows,env,req,call,admin};
}
const brief={name:'QA creator',email:'qa@example.test',vibe:'Purple',scope:'A matching scene family',want_streamkit:'on',consent:true};
test('inquiry saves once, returns no personal data, and rejects changed replays',async()=>{
 const s=setup(),headers={'Idempotency-Key':'a'.repeat(30)};
 const first=await portal(s.req('/api/studio/inquiries',brief,headers),s.env);assert.equal(first.status,201);const result=await first.json();assert.deepEqual(Object.keys(result),['id']);
 const repeated=await portal(s.req('/api/studio/inquiries',brief,headers),s.env);assert.equal((await repeated.json()).id,result.id);assert.equal([...s.rows.keys()].filter(k=>k.startsWith('lead:')).length,1);
 assert.equal((await portal(s.req('/api/studio/inquiries',{...brief,scope:'Changed'},headers),s.env)).status,409);
 const lead=s.rows.get('lead:'+result.id);assert.deepEqual(lead.services,['streamkit']);assert.equal(lead.email,brief.email);assert.equal(lead.privacyVersion,'2026-10-10');
});
test('inquiries reject cross-origin, missing consent, invalid inputs, oversized streams and spam',async()=>{
 const s=setup(),headers={'Idempotency-Key':'b'.repeat(30)};
 assert.equal((await portal(s.req('/api/studio/inquiries',brief,{...headers,Origin:'https://attacker.example'}),s.env)).status,403);
 for(const data of [{...brief,consent:false},{...brief,email:'bad'},{...brief,scope:''},{...brief,name:'x'.repeat(121)},{...brief,website:'spam'}])assert.equal((await portal(s.req('/api/studio/inquiries',data,headers),s.env)).status,400);
 assert.throws(()=>validateLead(null));assert.throws(()=>validateLead({...brief,consent:'true'}));
 const chunks=new ReadableStream({start(c){c.enqueue(new Uint8Array(16001));c.close();}});
 await assert.rejects(readJson(new Request('https://example.test',{method:'POST',headers:{'Content-Type':'application/json'},body:chunks,duplex:'half'})),/large/);
});
test('inquiries rate limit and cannot be read or edited by clients or scoped agents',async()=>{
 const s=setup();for(let i=0;i<10;i++)await portal(s.req('/api/studio/inquiries',brief,{'Idempotency-Key':'c'.repeat(30)}),s.env);
 assert.equal((await portal(s.req('/api/studio/inquiries',brief,{'Idempotency-Key':'c'.repeat(30)}),s.env)).status,429);
 await s.call('login',{key:await hash('client-session'),user:{id:'invite:client'}});
 for(const headers of [{},{Cookie:'__Host-or_client=client-session'},{Authorization:'Bearer '+ 'd'.repeat(64)}]){
 assert.equal((await portal(s.req('/api/portal/admin/inquiries',null,headers),s.env)).status,401);
 assert.equal((await portal(s.req('/api/portal/admin/inquiries',{id:'x',stage:'Won'},headers),s.env)).status,401);
 }
});
test('owner can update inquiries; stale edits cannot overwrite newer notes; client projects omit leads',async()=>{
 const s=setup(),headers=await s.admin();const created=await(await portal(s.req('/api/studio/inquiries',brief,{'Idempotency-Key':'e'.repeat(30)}),s.env)).json();
 const data=await(await portal(s.req('/api/portal/admin/inquiries',null,headers),s.env)).json();assert.equal(data.leads.length,1);
 const edit={id:created.id,stage:'Qualified',notes:'Review scope',expectedUpdatedAt:data.leads[0].updatedAt};
 // Force a stable older timestamp, avoiding same-millisecond fixture writes.
 const row=s.rows.get('lead:'+created.id);row.updatedAt='2026-01-01T00:00:00.000Z';s.rows.set('lead:'+created.id,row);edit.expectedUpdatedAt=row.updatedAt;
 assert.equal((await portal(s.req('/api/portal/admin/inquiries',edit,headers),s.env)).status,200);
 assert.equal((await portal(s.req('/api/portal/admin/inquiries',{...edit,notes:'Overwrite'},headers),s.env)).status,409);
 const updated=(await s.call('lead-list')).leads[0];assert.equal(updated.notes,'Review scope');assert.equal(updated.activity[0].author,'Studio admin');assert.equal((await s.call('projects',{owner:'invite:client'})).projects.length,0);
});
test('portfolio publication rejects private links, unauthorized clients and missing rights',async()=>{
 const s=setup(),entry={...concepts[0],rightsConfirmed:true,expectedUpdatedAt:null};
 assert.throws(()=>validatePortfolio({...entry,media:'/api/portal/files/private'}));assert.throws(()=>validatePortfolio({...entry,media:'https://example.test/private.mp4'}));assert.throws(()=>validatePortfolio({...entry,rightsConfirmed:false}));assert.throws(()=>validatePortfolio({...entry,slug:'../admin'}));
 assert.equal((await portal(s.req('/api/portal/admin/portfolio',entry),s.env)).status,401);
 const headers=await s.admin(),r=await portal(s.req('/api/portal/admin/portfolio',entry,headers),s.env);assert.equal(r.status,200);const saved=(await r.json()).item;
 assert.equal((await portal(s.req('/api/portal/admin/portfolio',entry,headers),s.env)).status,409);
 assert.equal((await portal(s.req('/api/portal/admin/portfolio',{...entry,published:false,expectedUpdatedAt:saved.updatedAt},headers),s.env)).status,200);
 const publicData=await s.call('portfolio-public');assert.equal(publicData.items.some(x=>x.slug===entry.slug),false);assert.equal([...s.rows.keys()].some(k=>k.startsWith('portfolio-audit:')),true);
 assert.equal((await worker.fetch(s.req('/work/'+entry.slug),{...s.env,ASSETS:{fetch:async()=>new Response('missing',{status:404})}})).status,404);
});
test('public case studies escape content and exclude private record fields',()=>{
 const html=casePage({...concepts[0],title:'<script>alert(1)</script>',internalNotes:'HIDDEN-INTERNAL',email:'HIDDEN-EMAIL'});assert.ok(!html.includes('<script>alert'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('HIDDEN-'));assert.ok(html.includes('preload="none"'));
});
test('canonical redirects preserve campaign parameters and private route aliases stay protected',async()=>{
 const s=setup();for(const [path,target] of [['/news','/'],['/raids.html','/services'],['/index.html','/'],['/services.html','/services'],['/roster','/portfolio']]){const r=await worker.fetch(s.req(path+'?utm_source=test'),s.env);assert.equal(r.status,301);assert.equal(r.headers.get('Location'),target+'?utm_source=test');}
 for(const path of ['/project-admin/','/project-admin.html/','/api/portal/admin/inquiries/']){const r=await worker.fetch(s.req(path),s.env);assert.equal(r.status,path.startsWith('/api/')?401:303);assert.equal(r.headers.get('Cache-Control'),'no-store');}
 assert.equal((await worker.fetch(s.req('/%E0%A4%A'),s.env)).status,400);
 const page=await worker.fetch(s.req('/'),s.env);assert.equal(page.headers.get('X-Frame-Options'),'DENY');assert.match(page.headers.get('Content-Security-Policy'),/object-src 'none'/);
});
test('sitemap includes services and only published case studies',async()=>{const s=setup();const r=await worker.fetch(s.req('/sitemap.xml'),s.env);assert.equal(r.status,200);const xml=await r.text();assert.ok(xml.includes('/services/creator-websites'));assert.ok(xml.includes('/work/arcane-stream-world'));assert.ok(!xml.includes('/admin'));assert.ok(!xml.includes('.html</loc>'));});
test('kit handoff accepts only known IDs, deduplicates items and excludes arbitrary quote input',()=>{assert.equal(selectedKit('music,music,<script>,voice').length,2);assert.match(describeKit('music,voice'),/\$328/);assert.equal(describeKit('999999'), '');assert.match(describeKit('website'),/Final scope and price require studio approval/);});
test('internal price model covers costs, target margin and invalid fee assumptions',()=>{const result=priceModel({hours:4,revisionHours:1,hourlyCost:40,generationCost:20,softwareAllocation:10,complexity:1,urgency:1,feePercent:3,feeFixed:.3,marginPercent:40,publishedPrice:299});assert.equal(result.cost,230);assert.ok(Math.abs(result.recommended-230.3/.57)<.00001);assert.ok(Math.abs(result.contribution-59.73)<.00001);assert.throws(()=>priceModel({hours:-1}));});
