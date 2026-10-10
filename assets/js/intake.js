import {KIT,selectedKit,describeKit} from './catalog.js';
const boxes=[...document.querySelectorAll('[data-quote]')],addons=[...document.querySelectorAll('[data-add-quote]')];
let kit=[];
function updateKit(){
  const ids=new Set(boxes.flatMap((input,i)=>input.checked?[KIT[i][0]]:[]));
  for(const b of addons){if(b.classList.contains('active'))ids.add({'199':'music','129':'voice','119':'emotes6','399':'trailer'}[b.dataset.addQuote]);b.setAttribute('aria-pressed',String(b.classList.contains('active')));}
  kit=KIT.filter(([id])=>ids.has(id));
  const total=document.querySelector('[data-quote-total]');if(total){total.textContent='$'+kit.reduce((s,x)=>s+x[2],0).toLocaleString();total.setAttribute('aria-live','polite');}
  const link=document.querySelector('[data-kit-link]');if(link)link.href='/start-project'+(kit.length?'?kit='+encodeURIComponent(kit.map(x=>x[0]).join(',')):'');
}
boxes.forEach(b=>b.addEventListener('change',updateKit));addons.forEach(b=>b.addEventListener('click',()=>queueMicrotask(updateKit)));updateKit();
const form=document.querySelector('#project-form'),params=new URLSearchParams(location.search);
if(form){
 const items=selectedKit(params.get('kit')),summary=describeKit(params.get('kit'));
 if(items.length){for(const item of items){const input=form.elements['want_'+item[3]];if(input)input.checked=true;}form.elements.configuration.value=summary;const note=document.querySelector('[data-kit-summary]');note.hidden=false;note.textContent=summary;}
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
