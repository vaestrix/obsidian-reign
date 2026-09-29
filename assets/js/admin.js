const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
let state={news:[],raids:[],roster:[],applications:[],settings:{}};
let tab="overview";
let lastRefresh=null;
let refreshMessage="";

async function api(path,opts={}){
  const r=await fetch(path,{headers:{"Content-Type":"application/json",...(opts.headers||{})},...opts});
  if(!r.ok){
    const t=await r.text();
    throw new Error(t||("Request failed: "+r.status));
  }
  return r.json();
}

async function load(showFeedback=false){
  const btn=document.querySelector("[data-refresh]");
  if(showFeedback && btn){
    btn.disabled=true;
    btn.textContent="Refreshing…";
  }
  try{
    state=await api("/api/admin/state");
    lastRefresh=new Date();
    refreshMessage="Data refreshed successfully";
    render();
  }catch(err){
    refreshMessage="Refresh failed: "+err.message;
    render();
    throw err;
  }finally{
    const newBtn=document.querySelector("[data-refresh]");
    if(newBtn){
      newBtn.disabled=false;
      newBtn.textContent="Refresh Data";
    }
  }
}

async function action(payload){
  const res=await api("/api/admin/action",{method:"POST",body:JSON.stringify(payload)});
  state=res.state;
  render();
}

function badge(status){
  return '<span class="admin-badge admin-badge-'+esc(String(status).toLowerCase())+'">'+esc(status)+'</span>';
}

function renderOverview(){
  const pending=state.applications.filter(a=>a.status==="Pending").length;
  return `
    <div class="admin-toolbar">
      <div><p class="eyebrow">LEGION COMMAND</p><h2>Command Overview</h2></div>
      <div class="admin-refresh-wrap">
        <button class="btn btn-gold" data-refresh>Refresh Data</button>
        <small class="admin-refresh-status">${esc(refreshMessage || "Ready")} ${lastRefresh ? "• "+lastRefresh.toLocaleTimeString([], {hour:"numeric",minute:"2-digit",second:"2-digit"}) : ""}</small>
      </div>
    </div>
    <div class="stat-grid">
      <div class="stat"><strong>${state.news.length}</strong><small>News Posts</small></div>
      <div class="stat"><strong>${state.raids.length}</strong><small>Operations</small></div>
      <div class="stat"><strong>${state.roster.length}</strong><small>Roster Members</small></div>
      <div class="stat"><strong>${pending}</strong><small>Pending Applications</small></div>
    </div>
    <div class="admin-section">
      <div class="section-head"><div><p class="eyebrow">QUEUE</p><h2>Applications Requiring Review</h2></div></div>
      ${state.applications.filter(a=>a.status==="Pending").slice(0,6).map(applicationCard).join("") || '<p class="muted">No pending applications.</p>'}
    </div>`;
}

function applicationCard(a){
  return `<article class="application-card">
    <div class="application-main">
      <div class="application-title"><strong>${esc(a.name)}</strong>${badge(a.status)}</div>
      <div class="application-meta">
        <span><b>Class:</b> ${esc(a.className)}</span>
        <span><b>Interest:</b> ${esc(a.interest)}</span>
        ${a.discord?'<span><b>Discord:</b> '+esc(a.discord)+'</span>':""}
      </div>
      ${a.notes?'<p>'+esc(a.notes)+'</p>':""}
      <small>Submitted ${new Date(a.submittedAt).toLocaleString()}</small>
    </div>
    <div class="application-actions">
      ${a.status==="Pending" ? `
        <label>Role<select data-app-role="${esc(a.id)}">
          <option>Member</option><option>Veteran</option><option>Raider</option><option>PvP Team</option><option>Raid Lead</option><option>Officer</option>
        </select></label>
        <button class="btn btn-purple" data-app-action="accept" data-id="${esc(a.id)}">Accept</button>
        <button class="btn btn-gold" data-app-action="deny" data-id="${esc(a.id)}">Deny</button>`
        : '<button class="btn btn-gold" data-app-action="delete" data-id="'+esc(a.id)+'">Delete</button>'}
    </div>
  </article>`;
}

function renderApplications(){
  return `<div class="admin-toolbar"><div><p class="eyebrow">RECRUITMENT</p><h2>Applications Console</h2></div></div>
    <div class="admin-filter-row">
      <button class="filter-chip active" data-app-filter="All">All</button>
      <button class="filter-chip" data-app-filter="Pending">Pending</button>
      <button class="filter-chip" data-app-filter="Accepted">Accepted</button>
      <button class="filter-chip" data-app-filter="Denied">Denied</button>
    </div>
    <div class="applications-list" id="applications-list">${state.applications.map(applicationCard).join("") || '<p class="muted">No applications submitted yet.</p>'}</div>`;
}

function rosterItem(x){
  return `<div class="admin-item roster-admin-item">
    <div><strong>${esc(x.name)}</strong><div class="muted">${esc(x.role)} • ${esc(x.className||"Unspecified")} • ${esc(x.interest||"Both")} • ${esc(x.status||"Active")}</div></div>
    <div class="admin-item-actions">
      <button data-edit-roster="${esc(x.id)}">EDIT</button>
      <button data-delete-roster="${esc(x.id)}">REMOVE</button>
    </div>
  </div>`;
}

function renderRoster(){
  return `<div class="admin-toolbar"><div><p class="eyebrow">LEGION</p><h2>Roster Management</h2></div></div>
  <form id="roster-form" class="admin-editor">
    <input type="hidden" name="id">
    <div class="form-grid">
      <label>Name<input name="name" required></label>
      <label>Role<select name="role">
        <option>Guild Leader</option><option>Officer</option><option>Raid Lead</option><option>Veteran</option><option>Raider</option><option>PvP Team</option><option>Member</option>
      </select></label>
      <label>Class<input name="className" required placeholder="Templar, Sorcerer, Spiritmaster..."></label>
      <label>Interest<select name="interest"><option>PvE</option><option>PvP</option><option>Both</option></select></label>
      <label>Status<select name="status"><option>Active</option><option>Inactive</option></select></label>
    </div>
    <div class="admin-form-actions">
      <button class="btn btn-gold" type="submit">Save Member</button>
      <button class="btn btn-purple" type="button" data-clear-roster>Clear</button>
    </div>
  </form>
  <div class="admin-list">${state.roster.map(rosterItem).join("")}</div>`;
}

function renderNews(){
  return `<div class="admin-toolbar"><div><p class="eyebrow">PUBLISHING</p><h2>News Control</h2></div></div>
  <form id="news-form" class="admin-editor"><div class="form-grid">
    <label>Title<input name="title" required></label>
    <label>Date<input name="date" type="date" required></label>
    <label>Category<input name="category" value="Guild"></label>
    <label class="full">Excerpt<textarea name="excerpt" required></textarea></label>
  </div><button class="btn btn-gold">Add Post</button></form>
  <div class="admin-list">${state.news.map(x=>`<div class="admin-item"><div><strong>${esc(x.title)}</strong><div class="muted">${esc(x.date)} • ${esc(x.category)}</div></div><button data-delete="news" data-id="${esc(x.id)}">REMOVE</button></div>`).join("")}</div>`;
}

function renderRaids(){
  return `<div class="admin-toolbar"><div><p class="eyebrow">OPERATIONS</p><h2>Raid & Event Control</h2></div></div>
  <form id="raid-form" class="admin-editor"><div class="form-grid">
    <label>Name<input name="name" required></label>
    <label>Date<input name="date" type="date" required></label>
    <label>Time<input name="time" value="8:00 PM CT"></label>
    <label>Status<input name="status" value="Signups Open"></label>
  </div><button class="btn btn-gold">Add Operation</button></form>
  <div class="admin-list">${state.raids.map(x=>`<div class="admin-item"><div><strong>${esc(x.name)}</strong><div class="muted">${esc(x.date)} • ${esc(x.time)} • ${esc(x.status)}</div></div><button data-delete="raids" data-id="${esc(x.id)}">REMOVE</button></div>`).join("")}</div>`;
}

function renderSettings(){
  return `<div class="admin-toolbar"><div><p class="eyebrow">CONFIGURATION</p><h2>Site Settings</h2></div></div>
  <form id="settings-form" class="admin-editor"><div class="form-grid">
    <label class="full">Discord URL<input name="discord" value="${esc(state.settings.discord||"")}"></label>
    <label>Server<input name="server" value="${esc(state.settings.server||"")}"></label>
    <label>Recruitment<select name="recruitment"><option>Open</option><option>Selective</option><option>Closed</option></select></label>
  </div><button class="btn btn-gold">Save Settings</button></form>`;
}

function render(){
  $$(".admin-nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  const m=$("#admin-main");
  if(tab==="overview") m.innerHTML=renderOverview();
  if(tab==="applications") m.innerHTML=renderApplications();
  if(tab==="news") m.innerHTML=renderNews();
  if(tab==="raids") m.innerHTML=renderRaids();
  if(tab==="roster") m.innerHTML=renderRoster();
  if(tab==="settings") m.innerHTML=renderSettings();
  bind();
}

function bind(){
  $("[data-refresh]")?.addEventListener("click",()=>load(true).catch(()=>{}));

  $$("#applications-list [data-app-action], #admin-main [data-app-action]").forEach(btn=>btn.addEventListener("click",async()=>{
    const id=btn.dataset.id;
    const role=$(`[data-app-role="${CSS.escape(id)}"]`)?.value||"Member";
    await action({type:"application",action:btn.dataset.appAction,id,role});
  }));

  $$("[data-app-filter]").forEach(btn=>btn.addEventListener("click",()=>{
    $$("[data-app-filter]").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    const wanted=btn.dataset.appFilter;
    const list=$("#applications-list");
    list.innerHTML=state.applications.filter(a=>wanted==="All"||a.status===wanted).map(applicationCard).join("")||'<p class="muted">No applications in this category.</p>';
    bind();
  }));

  $("#roster-form")?.addEventListener("submit",async e=>{
    e.preventDefault();
    const item=Object.fromEntries(new FormData(e.currentTarget));
    const id=item.id; delete item.id;
    await action({type:"roster",action:id?"update":"add",id,item});
  });

  $$("[data-edit-roster]").forEach(btn=>btn.addEventListener("click",()=>{
    const x=state.roster.find(r=>r.id===btn.dataset.editRoster); if(!x)return;
    const f=$("#roster-form"); f.id.value=x.id; f.name.value=x.name; f.role.value=x.role; f.className.value=x.className||""; f.interest.value=x.interest||"Both"; f.status.value=x.status||"Active"; f.scrollIntoView({behavior:"smooth",block:"center"});
  }));
  $$("[data-delete-roster]").forEach(btn=>btn.addEventListener("click",()=>action({type:"roster",action:"delete",id:btn.dataset.deleteRoster})));
  $("[data-clear-roster]")?.addEventListener("click",()=>$("#roster-form")?.reset());

  $("#news-form")?.addEventListener("submit",async e=>{
    e.preventDefault(); await action({type:"news",action:"add",item:Object.fromEntries(new FormData(e.currentTarget))});
  });
  $("#raid-form")?.addEventListener("submit",async e=>{
    e.preventDefault(); await action({type:"raids",action:"add",item:Object.fromEntries(new FormData(e.currentTarget))});
  });
  $$("[data-delete]").forEach(btn=>btn.addEventListener("click",()=>action({type:btn.dataset.delete,action:"delete",id:btn.dataset.id})));

  $("#settings-form")?.addEventListener("submit",async e=>{
    e.preventDefault(); await action({type:"settings",action:"update",item:Object.fromEntries(new FormData(e.currentTarget))});
  });
  const sf=$("#settings-form"); if(sf?.recruitment) sf.recruitment.value=state.settings.recruitment||"Open";
}

$$("[data-tab]").forEach(b=>b.addEventListener("click",()=>{tab=b.dataset.tab;render()}));
load().catch(err=>{$("#admin-main").innerHTML='<div class="notice">Could not load Legion Command data: '+esc(err.message)+'</div>';});
