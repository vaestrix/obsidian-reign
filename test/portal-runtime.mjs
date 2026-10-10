// Runs against an isolated local Worker with synthetic admin credentials.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:8791', password='local-portal-test-only', digest=createHash('sha256').update(password).digest('hex');
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev','--local','--port','8791','--compatibility-date','2026-10-03','--persist-to','.wrangler/portal-test','--var','PUBLIC_ORIGIN:'+origin,'--var','ADMIN_PASSWORD_SHA256:'+digest],{stdio:['ignore','pipe','pipe'],windowsHide:true});
let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
const auth='Basic '+Buffer.from('admin:'+password).toString('base64');
async function request(path,data,headers={}){return fetch(origin+path,{redirect:'manual',method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json',Origin:origin}:{}),...headers},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(8000)});}
try{
  let ready=false;const deadline=Date.now()+45000;while(Date.now()<deadline){try{const r=await request('/api/portal/providers');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
  if(!ready)throw new Error('Local Worker did not become ready: '+output.slice(-1500));
  for(const p of ['/admin/projects','/project-admin.html','/project-admin','/api/portal/admin/projects','/api/portal/projects'])assert.equal((await request(p)).status,p.startsWith('/api/')?401:303,p);
  assert.equal((await request('/admin/projects',null,{Authorization:auth})).status,200);
  const failed=await request('/auth/admin/login',{password:'incorrect'});assert.equal(failed.status,401);assert.equal(failed.headers.has('www-authenticate'),false);
  const signed=await request('/auth/admin/login',{password});assert.equal(signed.status,200);const adminCookie=signed.headers.get('set-cookie').split(';')[0];assert.match(signed.headers.get('set-cookie'),/HttpOnly/);
  assert.equal((await request('/api/portal/admin/projects',null,{Cookie:adminCookie})).status,200);
  assert.equal((await request('/admin/projects',null,{Cookie:adminCookie})).status,200);
  assert.equal((await request('/auth/admin/login',{password},{Origin:'https://other.example'})).status,403);
  await request('/auth/admin/logout',{}, {Cookie:adminCookie});assert.equal((await request('/api/portal/admin/projects',null,{Cookie:adminCookie})).status,401);

  const create=await request('/api/portal/admin/projects',{title:'Local QA project',owner:'invite:local-qa',stage:3,due:'2026-12-15',summary:'Local test only',nextStep:'Review the animation',fileUrl:'https://example.com/review',update:'Ready to review'},{Authorization:auth});assert.equal(create.status,200);const {project}=await create.json();
  const ir=await request('/api/portal/admin/invite',{id:project.id},{Authorization:auth});const {code}=await ir.json();assert.equal(code.length,64);
  const lr=await request('/auth/client/invite',{code});assert.equal(lr.status,200);const cookie=lr.headers.get('Set-Cookie').split(';')[0];
  const mine=await request('/api/portal/projects',null,{Cookie:cookie});const data=await mine.json();assert.equal(data.projects.some(p=>p.id===project.id),true);
  const feedback=await request('/api/portal/feedback',{id:project.id,message:'Local feedback check'},{Cookie:cookie});assert.equal(feedback.status,200);
  const admin=await(await request('/api/portal/admin/projects',null,{Authorization:auth})).json();assert.equal(admin.projects.find(p=>p.id===project.id).timeline[0].author,'Client');
  const publish=await request('/api/portal/admin/projects',{...project,reviewLabel:'Concept review',reviewUrl:'https://example.com/concept',revisionsIncluded:'2',revisionsUsed:'0',nextUpdateDate:'2026-12-10'},{Authorization:auth});assert.equal(publish.status,200);const version=(await publish.json()).project.reviews[0];
  assert.equal((await request('/api/portal/review',{id:project.id,versionId:version.id,action:'changes-requested'},{Cookie:cookie})).status,400);
  assert.equal((await request('/api/portal/review',{id:project.id,versionId:version.id,action:'approved'},{Cookie:cookie})).status,200);
  assert.equal((await request('/api/portal/review',{id:project.id,versionId:version.id,action:'changes-requested',message:'Replay'},{Cookie:cookie})).status,409);
  const reviewed=(await(await request('/api/portal/projects',null,{Cookie:cookie})).json()).projects.find(p=>p.id===project.id);assert.equal(reviewed.reviews[0].status,'approved');assert.equal(reviewed.revisionsUsed,0);
  assert.equal((await request('/auth/client/invite',{code})).status,400);
  assert.equal((await request('/api/portal/feedback',{id:project.id,message:'Cross-site'},{Cookie:cookie,Origin:'https://evil.example'})).status,403);
  await request('/auth/client/logout',{}, {Cookie:cookie});assert.equal((await request('/api/portal/projects',null,{Cookie:cookie})).status,401);
  console.log('Local Worker: admin protection, project creation, single-use invite, private retrieval, feedback, preview publishing, approval, replay rejection, CSRF and logout passed.');
}finally{child.kill();}

