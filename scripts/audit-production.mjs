// Diagnostics only: public GET requests. No forms, accounts, email or payment actions.
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import lighthouse from 'lighthouse';
import {launch} from 'chrome-launcher';
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.AUDIT_ORIGIN||'https://obsidianreign.gg';
await mkdir('audit-results',{recursive:true});
let sitemapResponse;for(let attempt=0;attempt<30;attempt++){try{sitemapResponse=await fetch(origin+'/sitemap.xml');if(sitemapResponse.ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}if(!sitemapResponse?.ok)throw Error('Audit site unavailable');const sitemap=await sitemapResponse.text();
const urls=[...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>new URL(new URL(x[1]).pathname,origin).href))];urls.push(origin+'/after-dark');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
const page=await context.newPage(),audits=[];
try{for(const url of urls){try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});if(url.endsWith('/after-dark'))await page.locator('#enter').click();const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();audits.push({url,violations:result.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,helpUrl:v.helpUrl,nodes:v.nodes.map(n=>({html:n.html,target:n.target,failureSummary:n.failureSummary}))}))});}catch(error){audits.push({url,error:String(error)});}}}finally{await browser.close();}
await writeFile('audit-results/accessibility.json',JSON.stringify(audits,null,2));
console.log('AXE_SUMMARY '+JSON.stringify(audits.map(a=>({url:a.url,error:a.error,violations:a.violations?.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}))}))));
const unique=new Map();for(const a of audits)for(const v of a.violations||[])for(const n of v.nodes){const key=v.id+'|'+n.html;if(!unique.has(key))unique.set(key,{url:a.url,id:v.id,impact:v.impact,...n});}console.log('AXE_DETAILS '+JSON.stringify([...unique.values()]));
const chrome=await launch({chromePath:chromium.executablePath(),chromeFlags:['--headless','--no-sandbox','--disable-dev-shm-usage']});
try{const result=await lighthouse(origin,{port:chrome.port,output:['json','html'],onlyCategories:['performance','accessibility','best-practices','seo'],logLevel:'error'});await writeFile('audit-results/lighthouse.json',result.report[0]);await writeFile('audit-results/lighthouse.html',result.report[1]);console.log('LIGHTHOUSE_SUMMARY '+JSON.stringify({at:new Date().toISOString(),target:origin,environment:origin.includes('127.0.0.1')?'Synthetic local candidate, mobile lab run; SEO noindex is expected':'Production mobile simulated lab run; not field data',scores:Object.fromEntries(Object.entries(result.lhr.categories).map(([k,v])=>[k,v.score])),metrics:Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index'].map(k=>[k,{value:result.lhr.audits[k].numericValue,display:result.lhr.audits[k].displayValue}])),opportunities:Object.values(result.lhr.audits).filter(a=>a.details?.type==='opportunity'&&a.score!==null&&a.score<1).map(a=>({id:a.id,title:a.title,savings:a.details.overallSavingsMs}))}));}finally{await chrome.kill();}

if(audits.some(a=>a.error||(a.violations||[]).length))process.exitCode=1;
