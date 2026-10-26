// Read-only production smoke checks. Never submit forms, emails, invoices or payments.
import assert from 'node:assert/strict';
const origin='https://obsidianreign.gg',results=[];
async function get(path,options={}){const r=await fetch(new URL(path,origin),{redirect:'manual',signal:AbortSignal.timeout(20000),...options});return {r,text:options.method==='HEAD'?'':await r.text()};}
let home;
for(let attempt=0;attempt<18;attempt++){home=await get('/');if(home.r.status===200&&home.text.includes('Choose your assets')&&home.text.includes('3 static stream layouts'))break;if(attempt===17)throw Error('Repair release did not become visible on production');await new Promise(r=>setTimeout(r,10000));}
assert.equal(home.r.status,200);assert(!home.text.includes('data-quote-total>$0'));
const pricing=await get('/pricing');assert.equal(pricing.r.status,200);assert(pricing.text.includes('ONE SHARED CINEMATIC MASTER'));assert(pricing.text.includes('Midnight Atlas Studios'));
results.push({page:'/',status:home.r.status,repairVisible:true},{page:'/pricing',status:pricing.r.status,scopeAndMerchantVisible:true});
const robots=await get('/robots.txt');assert.equal(robots.r.status,200);assert(robots.text.includes('Sitemap: '+origin+'/sitemap.xml'));assert(!/Disallow:\s*\/\s*$/m.test(robots.text));
const sitemap=await get('/sitemap.xml');assert.equal(sitemap.r.status,200);assert.match(sitemap.r.headers.get('content-type'),/xml/);const urls=[...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);assert(urls.length>=19);assert.equal(new Set(urls).size,urls.length);
const assets=new Set();
for(let start=0;start<urls.length;start+=4){await Promise.all(urls.slice(start,start+4).map(async url=>{assert.equal(new URL(url).origin,origin);const {r,text}=await get(url);assert.equal(r.status,200,url);assert(!/noindex/i.test(r.headers.get('x-robots-tag')||''),url);const canonical=text.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];assert.equal(canonical,url,url);for(const m of text.matchAll(/(?:src|poster|href)=["']([^"']*assets\/[^"']+)["']/g))assets.add(new URL(m[1],url).href);results.push({page:new URL(url).pathname,status:r.status,canonical:true});}));}
for(let start=0,list=[...assets];start<list.length;start+=4){await Promise.all(list.slice(start,start+4).map(async url=>{const {r}=await get(url,{method:'HEAD'});assert.equal(r.status,200,url);}));}
for(const ua of ['Googlebot','bingbot','OAI-SearchBot']){const {r}=await get('/services/animated-alerts',{headers:{'user-agent':ua}});assert.equal(r.status,200,ua);results.push({userAgent:ua,status:r.status,note:'GitHub runner request; not verification from crawler IP ranges'});}
for(const path of ['/api/anna/status','/api/anna/health','/api/portal/admin/inquiries']){const {r}=await get(path);assert.equal(r.status,401,path);}
for(const [path,target]of [['/raids','/services'],['/news','/'],['/roster','/portfolio'],['/join','/start-project']]){const {r}=await get(path);assert.equal(r.status,301,path);assert.equal(r.headers.get('location'),target,path);}
const adult=await get('/after-dark');assert.equal(adult.r.status,200);assert.match(adult.r.headers.get('x-robots-tag'),/noindex/);
console.log(JSON.stringify({checkedAt:new Date().toISOString(),sitemapPages:urls.length,localAssets:assets.size,results},null,2));
