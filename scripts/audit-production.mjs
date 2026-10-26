// Diagnostics only: public GET requests. No forms, accounts, email or payment actions.
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import lighthouse from 'lighthouse';
import {launch} from 'chrome-launcher';
import {mkdir,writeFile} from 'node:fs/promises';
const origin='https://obsidianreign.gg';
await mkdir('audit-results',{recursive:true});
const sitemap=await(await fetch(origin+'/sitemap.xml')).text();
const urls=[...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]))];urls.push(origin+'/after-dark');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
const page=await context.newPage(),audits=[];
try{for(const url of urls){try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});if(url.endsWith('/after-dark'))await page.locator('#enter').click();const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();audits.push({url,violations:result.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,helpUrl:v.helpUrl,nodes:v.nodes.map(n=>({html:n.html,target:n.target,failureSummary:n.failureSummary}))}))});}catch(error){audits.push({url,error:String(error)});}}}finally{await browser.close();}
await writeFile('audit-results/accessibility.json',JSON.stringify(audits,null,2));
console.log('AXE_SUMMARY '+JSON.stringify(audits.map(a=>({url:a.url,error:a.error,violations:a.violations?.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}))}))));
const chrome=await launch({chromePath:chromium.executablePath(),chromeFlags:['--headless','--no-sandbox','--disable-dev-shm-usage']});
try{const result=await lighthouse(origin,{port:chrome.port,output:['json','html'],onlyCategories:['performance','accessibility','best-practices','seo'],logLevel:'error'});await writeFile('audit-results/lighthouse.json',result.report[0]);await writeFile('audit-results/lighthouse.html',result.report[1]);console.log('LIGHTHOUSE_SUMMARY '+JSON.stringify({at:new Date().toISOString(),environment:'GitHub Actions container, mobile simulated lab run; not field data',scores:Object.fromEntries(Object.entries(result.lhr.categories).map(([k,v])=>[k,v.score])),metrics:Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index'].map(k=>[k,{value:result.lhr.audits[k].numericValue,display:result.lhr.audits[k].displayValue}])),opportunities:Object.values(result.lhr.audits).filter(a=>a.details?.type==='opportunity'&&a.score!==null&&a.score<1).map(a=>({id:a.id,title:a.title,savings:a.details.overallSavingsMs}))}));}finally{await chrome.kill();}
