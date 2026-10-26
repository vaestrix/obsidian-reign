import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
export function indexNowPayload(xml,config){
 if(config.host!=='obsidianreign.gg'||!/^[a-zA-Z0-9-]{8,128}$/.test(config.key)||config.keyLocation!=='https://'+config.host+'/'+config.key+'.txt')throw Error('Invalid owned-host IndexNow configuration');
 const urls=[...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]))];
 if(!urls.length||urls.length>10000)throw Error('Invalid IndexNow URL count');
 for(const value of urls){const u=new URL(value);if(u.protocol!=='https:'||u.hostname!==config.host||u.port||u.search||u.hash||/^\/(api|auth|admin|client-portal|after-dark)(\/|$)/.test(u.pathname))throw Error('Only public canonical studio URLs may be submitted');}
 return {host:config.host,key:config.key,keyLocation:config.keyLocation,urlList:urls};
}
async function main(){
 const changed=spawnSync('git',['diff','--name-only','HEAD^','HEAD'],{encoding:'utf8'});
 if(changed.status===0&&!changed.stdout.split('\n').some(p=>/^(index\.html|pricing\.html|services\.html|start-project\.html|assets\/|src\/(public-content|learn|portfolio|worker)\.js|scripts\/build-pages\.js|config\/indexnow\.json)/.test(p))){console.log('IndexNow skipped: no public content changes.');return;}
 const config=JSON.parse(await readFile(new URL('../config/indexnow.json',import.meta.url),'utf8'));
 let verified=false;
 for(let attempt=0;attempt<18;attempt++){const r=await fetch(config.keyLocation,{signal:AbortSignal.timeout(20000)});if(r.ok&&(await r.text()).trim()===config.key){verified=true;break;}await new Promise(r=>setTimeout(r,10000));}
 if(!verified)throw Error('IndexNow key file is not deployed; no submission attempted');
 const response=await fetch('https://'+config.host+'/sitemap.xml',{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Sitemap unavailable; no IndexNow submission attempted');
 const payload=indexNowPayload(await response.text(),config);
 const result=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});
 if(![200,202].includes(result.status))throw Error('IndexNow submission returned '+result.status);
 console.log(JSON.stringify({at:new Date().toISOString(),status:result.status,urlCount:payload.urlList.length,meaning:result.status===202?'URLs received; key validation pending. Indexing is not confirmed.':'URLs received. Indexing is not confirmed.'}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
