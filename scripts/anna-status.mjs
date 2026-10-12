import {readFile} from 'node:fs/promises';
let credential={};try{credential=JSON.parse(await readFile(new URL('../.wrangler/anna-agent-credential.json',import.meta.url),'utf8'));}catch{}
const token=process.env.ANNA_AGENT_TOKEN||credential.token;if(!token)throw Error('Anna scoped credential unavailable');
const r=await fetch('https://obsidianreign.gg/api/anna/status',{headers:{Authorization:'Bearer '+token},redirect:'manual',signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Status read failed '+r.status);console.log(JSON.stringify(await r.json()));
