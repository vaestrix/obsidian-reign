// Safe external smoke tests for a deployed staging Worker.
// Does not create projects, upload files, or authenticate as a real customer.
// Usage: STAGING_URL=https://obsidian-reign-staging.<account>.workers.dev node scripts/staging-smoke.js
const base=process.env.STAGING_URL;
if(!base)throw new Error('STAGING_URL is required.');
const url=new URL(base);
if(url.protocol!=='https:'||!url.hostname.endsWith('.workers.dev')||!url.hostname.startsWith('obsidian-reign-staging.'))throw new Error('Only the dedicated staging workers.dev hostname is allowed.');
const origin=url.origin;
const checks=[
 {name:'unauthenticated file listing',path:'/api/portal/delivery-files?projectId=synthetic&versionId=synthetic',method:'GET',allowed:[401,403]},
 {name:'unauthenticated file download',path:'/api/portal/delivery-download?projectId=synthetic&versionId=synthetic&file=sample.png',method:'GET',allowed:[401,403]},
 {name:'unauthenticated refresh',path:'/api/portal/delivery-refresh-check',method:'POST',allowed:[401,403],body:{projectId:'synthetic',versionId:'synthetic'}},
 {name:'agent task access without token',path:'/api/portal/internal/agent-tasks?projectId=synthetic',method:'GET',allowed:[401,403]}
];
let failed=0;
for(const check of checks){
 const response=await fetch(origin+check.path,{method:check.method,redirect:'manual',headers:check.body?{'Content-Type':'application/json','Origin':origin}:{},body:check.body?JSON.stringify(check.body):undefined});
 const pass=check.allowed.includes(response.status)&&!response.headers.get('location');
 console.log((pass?'PASS':'FAIL')+' '+check.name+' ('+response.status+')');
 if(!pass)failed++;
}
if(failed)process.exitCode=1;
