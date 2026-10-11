// Studio commercial records share the existing private ProjectHub storage.
export const LEAD_STAGES = ['New', 'Qualified', 'Quoted', 'Won', 'Closed'];
export const SERVICE_FIELDS = ['streamkit','emotes','cinematics','audio','branding','site','shorts','monthly','social','youtube','sponsor','vertical'];
export class InputError extends Error {}
const field = (data, key, max, required = false) => {
  const value = data[key] ?? '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new InputError('Please check ' + key + '.');
  return value.trim();
};
export function validateLead(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new InputError('A project brief is required.');
  const name = field(data, 'name', 120, true), email = field(data, 'email', 254, true);
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) throw new InputError('Please enter a valid email address.');
  if (data.consent !== true) throw new InputError('Please acknowledge the privacy notice.');
  const kind = data.kind === 'audit' ? 'audit' : 'project';
  const scope = field(data, 'scope', 4000, true), vibe = field(data, 'vibe', 2000, kind === 'project');
  const services = SERVICE_FIELDS.filter(key => data['want_' + key] === 'on' || data['want_' + key] === true);
  return {name,email,scope,vibe,kind,services,platform:field(data,'platform',80),budget:field(data,'budget',80),refs:field(data,'refs',3000),configuration:field(data,'configuration',2000),privacyVersion:'2026-10-10'};
}
export async function readJson(request) {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) throw new InputError('Send JSON.');
  if (Number(request.headers.get('Content-Length')) > 16000) throw new InputError('Request too large.');
  const reader=request.body?.getReader();if(!reader)throw new InputError('A request body is required.');
  let size=0;const chunks=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();throw new InputError('Request too large.');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new InputError('Invalid JSON.');}
}
export async function studioOperation(operation, data, store, now) {
  const at=new Date(now).toISOString();
  if(operation==='lead-create'){
    const key='lead-request:'+data.key, previous=await store.get(key);
    if(previous)return previous.fingerprint===data.fingerprint?{id:previous.id,duplicate:true}:{error:'This submission changed. Please submit it again.',conflict:true};
    const id=crypto.randomUUID(),lead={...validateLead(data.lead),id,stage:'New',createdAt:at,updatedAt:at,notes:'',activity:[{author:'Visitor',message:'Inquiry received',at}]};
    await store.put('lead:'+id,lead);await store.put(key,{id,fingerprint:data.fingerprint,expiresAt:now+86400000});
    return {id};
  }
  if(operation==='lead-list'){
    const rows=await store.list({prefix:'lead:',limit:201});
    return {leads:[...rows.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,200),hasMore:rows.size>200};
  }
  if(operation==='lead-update'){
    const lead=await store.get('lead:'+data.id);if(!lead)return {error:'Inquiry not found.'};
    if(!LEAD_STAGES.includes(data.stage))throw new InputError('Choose a valid inquiry stage.');
    if(data.expectedUpdatedAt!==lead.updatedAt)return {error:'This inquiry changed. Refresh before saving.',conflict:true};
    lead.stage=data.stage;lead.notes=field(data,'notes',3000);lead.updatedAt=new Date(Math.max(now,Date.parse(lead.updatedAt)+1)).toISOString();
    lead.activity=[{author:'Studio admin',message:'Stage: '+lead.stage+'; internal notes updated',at},...lead.activity].slice(0,50);
    await store.put('lead:'+lead.id,lead);return {lead};
  }
  return null;
}
