(() => {
  const form=document.getElementById('project-form');if(!form)return;
  const fields=[...form.querySelectorAll('input,select,textarea')].filter(f=>!['website','consent'].includes(f.name)),required=fields.filter(f=>f.required),key='obsidian-reign-brief-v1';
  const status=document.querySelector('[data-draft-status]'),progress=document.querySelector('[data-brief-progress]'),label=document.querySelector('[data-brief-progress-label]');
  function update(){const count=required.filter(f=>f.value.trim()&&f.validity.valid).length;progress.max=required.length;progress.value=count;label.textContent=count+' of '+required.length+' required fields complete';}
  form.addEventListener('input',update);form.addEventListener('change',update);update();
  document.querySelector('[data-save-draft]').addEventListener('click',()=>{try{const data={};fields.forEach(f=>{data[f.name]=f.type==='checkbox'?f.checked:f.value;});localStorage.setItem(key,JSON.stringify(data));status.textContent='Draft saved on this device. It has not been sent to the studio.';}catch{status.textContent='This browser could not save the draft. Keep this page open or create your brief.';}});
  document.querySelector('[data-restore-draft]').addEventListener('click',()=>{try{const raw=localStorage.getItem(key);if(!raw){status.textContent='There is no saved draft on this device.';return;}const data=JSON.parse(raw);fields.forEach(f=>{if(!(f.name in data))return;if(f.type==='checkbox')f.checked=data[f.name]===true;else if(typeof data[f.name]==='string')f.value=data[f.name];});update();status.textContent='Saved draft restored. Review it before creating your brief.';}catch{status.textContent='The saved draft could not be restored.';}});
  document.querySelector('[data-clear-draft]').addEventListener('click',()=>{try{localStorage.removeItem(key);status.textContent='Saved draft removed from this device. Your current form is still here.';}catch{status.textContent='The saved draft could not be removed.';}});
})();
