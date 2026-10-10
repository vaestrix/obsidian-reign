import {readFile} from 'node:fs/promises';
const [command,path]=process.argv.slice(2);
if(command!=='queue'||!path)throw Error('Usage: node scripts/anna-queue.mjs queue PRIVATE_LEAD_JSON');
let credential={};try{credential=JSON.parse(await readFile(new URL('../.wrangler/anna-agent-credential.json',import.meta.url),'utf8'));}catch{}
const token=process.env.ANNA_AGENT_TOKEN||credential.token;
if(!token)throw Error('Anna agent credential is not configured.');
const lead=JSON.parse(await readFile(path,'utf8'));
const r=await fetch('https://obsidianreign.gg/api/anna/prospects',{method:'POST',redirect:'manual',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(lead),signal:AbortSignal.timeout(25000)});
const result=await r.json();console.log(JSON.stringify({status:r.status,...result}));if(!r.ok)process.exitCode=1;

