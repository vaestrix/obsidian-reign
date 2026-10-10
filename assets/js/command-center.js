import {priceModel} from './pricing-model.js';
const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
async function api(path,data){const r=await fetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const result=await r.json();if(!r.ok)throw new Error(result.error||'Unable to load studio records.');return result;}
const status=document.querySelector('#leads-status'),list=document.querySelector('#studio-leads');
async function refresh(){
 try{
  status.textContent='Loading private inquiries…';
  const [leads,projects]=await Promise.all([api('/api/portal/admin/inquiries'),api('/api/portal/admin/projects')]);
  const metrics=document.querySelector('#studio-metrics');metrics.replaceChildren();
  for(const [name,value] of [['New inquiries',leads.leads.filter(x=>x.stage==='New').length],['Qualified inquiries',leads.leads.filter(x=>x.stage==='Qualified').length],['Quotes marked sent',projects.projects.filter(x=>x.quoteStatus==='Sent').length],['Quotes marked accepted',projects.projects.filter(x=>x.quoteStatus==='Accepted').length],['Active projects',projects.projects.filter(x=>x.stage<4).length],['Collected revenue','Not connected']]){const card=make('div',undefined,'metric');card.append(make('span',name),make('strong',String(value)));metrics.append(card);}
  list.replaceChildren();status.textContent=leads.hasMore?'Showing up to 200 inquiries. Counts cover this loaded subset; payment metrics are unavailable.':'Inquiry and project counts are from saved records. Payment metrics are unavailable until a verified payment integration is connected.';
  if(!leads.leads.length)list.append(make('p','No inquiries have been submitted.','portal-note'));
  for(const lead of leads.leads){
   const card=make('article',undefined,'portal-admin-item');card.append(make('h3',lead.name),make('p',lead.email),make('small',lead.kind+' · '+new Date(lead.createdAt).toLocaleString()),make('p','Reference: '+lead.id),make('p',lead.scope),make('p',lead.vibe),make('p','Services: '+lead.services.join(', ')),make('p','Budget: '+lead.budget),make('p',lead.configuration),make('p','References: '+lead.refs));
   const form=make('form'),label=make('label','Pipeline stage'),select=make('select');for(const stage of ['New','Qualified','Quoted','Won','Closed']){const option=make('option',stage);option.value=stage;select.append(option);}select.value=lead.stage;label.append(select);
   const noteLabel=make('label','Private studio notes'),notes=make('textarea');notes.maxLength=3000;notes.value=lead.notes;noteLabel.append(notes);const button=make('button','Save inquiry','btn btn-gold');button.type='submit';const result=make('p');result.setAttribute('role','status');form.append(label,noteLabel,button,result);
   form.addEventListener('submit',async e=>{e.preventDefault();button.disabled=true;try{await api('/api/portal/admin/inquiries',{id:lead.id,stage:select.value,notes:notes.value,expectedUpdatedAt:lead.updatedAt});await refresh();}catch(error){result.textContent=error.message;}finally{button.disabled=false;}});
   const history=make('details');history.append(make('summary','Audit history'));for(const event of lead.activity)history.append(make('p',event.at+' · '+event.author+' · '+event.message));card.append(form,history);list.append(card);
  }
 }catch(error){status.textContent=error.message;}
}
document.querySelector('#refresh-leads')?.addEventListener('click',refresh);if(list)refresh();
const model=document.querySelector('#pricing-model');model?.addEventListener('submit',event=>{event.preventDefault();const output=document.querySelector('#pricing-model-result');try{const input=Object.fromEntries([...new FormData(model)].map(([k,v])=>[k,Number(v)]));const result=priceModel(input);const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);output.textContent='Estimated production cost: '+money(result.cost)+'. Suggested price for your target margin: '+money(result.recommended)+'. Contribution at the comparison price: '+money(result.contribution)+(result.margin===null?'': ' ('+result.margin.toFixed(1)+'%).')+' Planning assumptions only; published prices are unchanged.';}catch(error){output.textContent=error.message;}});
