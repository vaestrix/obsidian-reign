(()=>{
const root=document.querySelector('[data-layout-preview]');if(!root)return;
const stage=root.querySelector('[data-layout-stage]'),status=root.querySelector('[data-layout-status]');
function update(){root.querySelectorAll('[data-layout-value]').forEach(b=>b.setAttribute('aria-pressed',String(stage.dataset[b.dataset.layoutGroup]===b.dataset.layoutValue)));status.textContent=`${stage.dataset.aspect==='portrait'?'Portrait 9:16':'Landscape 16:9'} · ${stage.dataset.mode==='gameplay'?'Clean gameplay':'Starting Soon atmosphere'}`;}
root.querySelectorAll('[data-layout-value]').forEach(b=>b.addEventListener('click',()=>{stage.dataset[b.dataset.layoutGroup]=b.dataset.layoutValue;update();}));update();
})();
