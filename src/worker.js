import { receiveWebhook } from './savannah.js';
import legacyWorker, {adminAuthorized} from './legacy-worker.js';
import { portal } from './portal.js';
import {concepts,portfolioPage,casePage} from './portfolio.js';
import {services} from './public-content.js';
export { ProjectHub } from './portal.js';
export { CommandStore } from './legacy-worker.js';
export { SavannahInbox } from './savannah.js';

// Preserve the existing migration destinations, with actual permanent redirects.
const migrations = {news:'/',raids:'/services',roster:'/portfolio',join:'/start-project','who-we-are':'/',guides:'/services',profile:'/'};
const publicPages = new Set(['services','portfolio','pricing','start-project','client-portal','privacy']);
function secured(response, path, staging = false) {
  const headers=new Headers(response.headers);
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  headers.set('X-Frame-Options','DENY');
  headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  // Inline styles and existing scripts remain compatible; stronger CSP needs its own migration.
  headers.set('Content-Security-Policy',"base-uri 'self'; object-src 'none'; frame-ancestors 'none'");
  if(/^\/(api|auth|admin)(\/|$)/.test(path)||/^\/(project-admin|admin-login|client-portal)(\.html)?\/?$/.test(path)){
    headers.set('Cache-Control','no-store');headers.set('X-Robots-Tag','noindex, nofollow');
  }
  if(staging)headers.set('X-Robots-Tag','noindex, nofollow');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
const application = {
  async fetch(request, env) {
    let path;
    try { path=decodeURIComponent(new URL(request.url).pathname); }
    catch { return secured(Response.json({error:'Invalid URL.'},{status:400}),'/api/error'); }
    try {
      const name=path.replace(/^\//,'').replace(/\/$/,'').replace(/\.html$/,'');
      if(['GET','HEAD'].includes(request.method)){
        let target=migrations[name];
        if(path==='/index.html'||path==='/index')target='/';
        if(publicPages.has(name) && path!=='/'+name)target='/'+name;
        if(target)return secured(new Response(null,{status:301,headers:{Location:target+new URL(request.url).search}}),path);
      }
      if(['GET','HEAD'].includes(request.method) && (path==='/sitemap.xml'||path==='/portfolio'||/^\/work\/[a-z0-9-]+$/.test(path))){
        let items=concepts;
        if(env.PROJECT_HUB){const hub=env.PROJECT_HUB.get(env.PROJECT_HUB.idFromName('studio-projects'));const r=await hub.fetch(new Request('https://hub/portfolio-public',{method:'POST',body:'{}'}));if(!r.ok)throw new Error('Portfolio unavailable');items=(await r.json()).items;}
        if(path==='/sitemap.xml'){
          const paths=['/','/services','/portfolio','/pricing','/start-project','/privacy',...services.map(x=>'/services/'+x.slug),...items.map(x=>'/work/'+x.slug)];
          return secured(new Response(request.method==='HEAD'?null:'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>'<url><loc>https://obsidianreign.gg'+p+'</loc></url>').join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-cache'}}),path);
        }
        const item=items.find(x=>'/work/'+x.slug===path);
        if(path==='/portfolio'||item)return secured(new Response(request.method==='HEAD'?null:path==='/portfolio'?portfolioPage(items):casePage(item),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}}),path);
      }
      if((path==='/api/admin/state'||path==='/api/admin/action') && env.PROJECT_HUB && !await adminAuthorized(request,env)){
        const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(request.headers.get('CF-Connecting-IP')||'unknown'));
        const key='legacy-admin:'+Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
        const hub=env.PROJECT_HUB.get(env.PROJECT_HUB.idFromName('studio-projects'));
        const rate=await (await hub.fetch(new Request('https://hub/rate',{method:'POST',body:JSON.stringify({key})}))).json();
        if(!rate.allowed)return secured(Response.json({error:'Too many attempts. Wait a minute.'},{status:429}),path);
      }
      const response = await portal(request, env);
      if (response) return secured(response,path);
      if (path === '/webhooks/hostinger') return secured(await receiveWebhook(request, env),path);
      return secured(await legacyWorker.fetch(request, env),path);
    } catch {
      console.error(JSON.stringify({event:'request-failed',area:path.startsWith('/api/')?'api':'page'}));
      return secured(Response.json({error:'The studio is temporarily unavailable. Please try again.'},{status:503}),'/api/error');
    }
  }
};

export default {async fetch(request,env){const response=await application.fetch(request,env);return env.STAGING==='true'?secured(response,new URL(request.url).pathname,true):response;}};
