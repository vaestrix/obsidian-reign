import {readFile} from 'node:fs/promises';
const credential=JSON.parse(await readFile(new URL('../.wrangler/anna-agent-credential.json',import.meta.url),'utf8'));
const r=await fetch('https://obsidianreign.gg/api/anna/health',{headers:{Authorization:'Bearer '+credential.token},redirect:'manual',signal:AbortSignal.timeout(25000)});
if(!r.ok)throw Error('Agent health read failed '+r.status);
console.log(JSON.stringify(await r.json()));
