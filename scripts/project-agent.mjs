// Agent access is limited to project review and follow-up scheduling.
import {readFile} from 'node:fs/promises';
let credential={};try{credential=JSON.parse(await readFile(new URL('../.wrangler/portal-agent-credential.json',import.meta.url),'utf8'));}catch{}
const token=process.env.PORTAL_AGENT_TOKEN||credential.token,origin=process.env.PORTAL_AGENT_ORIGIN||credential.origin||'https://obsidianreign.gg';
if(!token)throw new Error('Project-agent credentials are not configured.');
const [command,...args]=process.argv.slice(2);let path='/api/portal/agent/projects',data;
if(command==='schedule'){const [id,date,...note]=args;if(!id||!date||!note.length)throw new Error('Usage: node scripts/project-agent.mjs schedule PROJECT_ID YYYY-MM-DD ACTION_NOTE');path='/api/portal/agent/followup';data={id,followupDate:date,followupNote:note.join(' ')};}else if(command!=='list')throw new Error('Usage: node scripts/project-agent.mjs list | schedule PROJECT_ID YYYY-MM-DD ACTION_NOTE');
const response=await fetch(origin+path,{method:data?'POST':'GET',headers:{Authorization:'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(15000)});
const result=await response.json();if(!response.ok)throw new Error(result.error||'Project API request failed.');console.log(JSON.stringify(result,null,2));
