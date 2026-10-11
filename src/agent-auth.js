import {authorizeAgentMessage} from './agent-policy.js';

const SUPPORTED = new Set(['anna','savannah','vesper','atlas','forge','mercury','sentinel','nova']);
const enc = new TextEncoder();
async function digest(value) {return new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value)));}
export async function authenticateAgent(request, env) {
  const agent=request.headers.get('X-Obsidian-Agent');
  if(!SUPPORTED.has(agent))return null;
  const auth=request.headers.get('Authorization')||'';
  if(!/^Bearer [A-Za-z0-9_-]{32,256}$/.test(auth))return null;
  const expected=env['AGENT_TOKEN_'+agent.toUpperCase()];
  if(typeof expected!=='string'||expected.length<32)return null;
  const [a,b]=await Promise.all([digest(auth),digest('Bearer '+expected)]);
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  return diff===0?agent:null;
}
export function validateAgentEnvelope(agent,input) {
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  const projectId=input.projectId,to=input.to,message=input.message;
  if(typeof projectId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(projectId))return null;
  if(typeof message!=='string'||!message.trim()||message.length>3000)return null;
  if(!authorizeAgentMessage({from:agent,to,channel:'internal'}))return null;
  return {projectId,from:agent,to,message:message.trim()};
}
