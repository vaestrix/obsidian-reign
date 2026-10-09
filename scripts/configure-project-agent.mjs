// Provision a narrowly scoped Worker secret without printing its value.
import {randomBytes} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const directory=new URL('../.wrangler/',import.meta.url),file=new URL('portal-agent-credential.json',directory);
let saved;try{saved=JSON.parse(await readFile(file,'utf8'));}catch{}
const token=saved?.token||randomBytes(32).toString('hex');
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','secret','put','PORTAL_AGENT_TOKEN'],{stdio:['pipe','ignore','ignore'],windowsHide:true});
child.stdin.end(token+'\n');
const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
if(code!==0)throw new Error('Could not configure the project-agent secret. No credential value was printed.');
await mkdir(directory,{recursive:true});await writeFile(file,JSON.stringify({origin:'https://obsidianreign.gg',token},null,2));
console.log('Project-agent access configured. Credential stored locally in the ignored .wrangler folder; value hidden.');
