import {KIT,selectedKit,describeKit} from './catalog.js';
const boxes=[...document.querySelectorAll('[data-quote]')],addons=[...document.querySelectorAll('[data-add-quote]')];
let kit=[];
function updateKit(){
  const ids=new Set(boxes.flatMap((input,i)=>input.checked?[KIT[i][0]]:[]));
  for(const b of addons){if(b.classList.contains('active'))ids.add({'199':'music','129':'voice','119':'emotes6','399':'trailer'}[b.dataset.addQuote]);b.setAttribute('aria-pressed',String(b.classList.contains('active')));}
  kit=KIT.filter(([id])=>ids.has(id));
  const total=document.querySelector('[data-quote-total]');if(total){total.textContent=kit.length?'$'+kit.reduce((s,x)=>s+x[2],0).toLocaleString():'Choose your assets';total.setAttribute('aria-live','polite');}
  const link=document.querySelector('[data-kit-link]');if(link)link.href='/start-project'+(kit.length?'?kit='+encodeURIComponent(kit.map(x=>x[0]).join(',')):'');
}
boxes.forEach(b=>b.addEventListener('change',updateKit));addons.forEach(b=>b.addEventListener('click',()=>queueMicrotask(updateKit)));updateKit();
const form=document.querySelector('#project-form'),params=new URLSearchParams(location.search);
if(form){
 const items=selectedKit(params.get('kit')),summary=describeKit(params.get('kit'));
 if(items.length){for(const item of items){const input=form.elements['want_'+item[3]];if(input)input.checked=true;}form.elements.configuration.value=summary;const note=document.querySelector('[data-kit-summary]');note.hidden=false;note.textContent=summary;}
 const afterDarkPackages={
  'after-dark':'After Dark custom creator identity',
  'after-dark-essentials':'After Dark — Velvet Essentials',
  'after-dark-motion':'After Dark — Midnight Motion',
  'after-dark-signature':'After Dark — Obsidian Signature',
  'after-dark-profile':'After Dark — Profile Essentials',
  'after-dark-social':'After Dark — Social & Launch Kit',
  'after-dark-brand-world':'After Dark — Signature Brand World'
 };
 const service=params.get('service');
 const afterDark=Object.hasOwn(afterDarkPackages,service)?afterDarkPackages[service]:null;
 if(afterDark){
  const context=afterDark+' · Custom quote; scope and price agreed before production.';
  form.elements.configuration.value=[form.elements.configuration.value,context].filter(Boolean).join('\n');
  const note=document.querySelector('[data-kit-summary]');note.hidden=false;note.textContent=form.elements.configuration.value;
  const notice=document.querySelector('[data-after-dark-inquiry]');if(notice)notice.hidden=false;
  const title=form.querySelector('h3');if(title)title.textContent='Your After Dark Brief';
  const heading=document.querySelector('main .hero h1');if(heading)heading.innerHTML='<span>YOUR LOOK. YOUR BRAND.</span><em>YOUR AFTER DARK BRIEF.</em>';
  for(const platform of ['OnlyFans','Fansly','Fanvue','Other subscription platform']){const option=document.createElement('option');option.value=platform;option.textContent=platform;form.elements.platform.append(option);}
  form.elements.platform.value='Multi-platform';
  form.elements.name.placeholder='Your creator or stage name';
  form.elements.vibe.placeholder='Your aesthetic, colors, existing brand and any boundaries. Face-forward or faceless?';
  form.elements.scope.placeholder='Which assets do you need, where will you use them, and what is your target date?';
  const picks={'after-dark-profile':['branding','social'],'after-dark-social':['social','shorts'],'after-dark-brand-world':['branding','social','site']};
  for(const pick of picks[service]||[]){const input=form.elements['want_'+pick];if(input)input.checked=true;}

  if(!form.elements.scope.value)form.elements.scope.value='I am interested in '+afterDark+'. Please help me define the visual direction, deliverables and custom quote.';
 }
}
function wire(form,status,emailLink,kind){
 if(!form)return;
 let pendingKey='',pendingBody='';
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const data=Object.fromEntries(new FormData(form));data.consent=form.elements.consent.checked;data.kind=kind;
  if(kind==='audit'){data.name='Creator audit';data.scope=data.goal;data.refs=data.channel;data.vibe='';}
  const serialized=JSON.stringify(data);
  if(serialized!==pendingBody){pendingKey=crypto.randomUUID();pendingBody=serialized;}
  const button=form.querySelector('[type=submit]');button.disabled=true;status.textContent='Submitting securely…';
  const fallback=Object.entries(data).filter(([k])=>!['website','consent'].includes(k)).map(([k,v])=>k+': '+v).join('\n');
  if(emailLink){emailLink.href='mailto:savannah@obsidianreign.gg?subject='+encodeURIComponent('Creator '+kind+' inquiry')+'&body='+encodeURIComponent(fallback);emailLink.hidden=true;}
  try{
   const response=await fetch('/api/studio/inquiries',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':pendingKey},body:serialized,signal:AbortSignal.timeout(15000)});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to submit.');
   status.textContent='Received. Your reference is '+result.id+'. The studio can now review your request. No payment has been taken. An email confirmation has not been sent.';
   button.textContent='REQUEST RECEIVED';
  }catch(error){status.textContent=(error.name==='TimeoutError'?'The connection timed out. Retry safely with the same details.':error.message)+' You can also email the brief below.';if(emailLink)emailLink.hidden=false;}
  finally{button.disabled=false;}
 });
}
wire(form,document.querySelector('[data-project-status]'),document.querySelector('[data-project-email]'),'project');
wire(document.querySelector('[data-audit-form]'),document.querySelector('[data-audit-status]'),document.querySelector('[data-audit-email]'),'audit');
