const FALLBACK={
  discord:"https://discord.gg/docgotgame",
  news:[
    {title:"Obsidian Reign Is Recruiting",date:"SEP 28, 2026",cat:"GUILD",excerpt:"We’re building a serious core for Aion 2 Global. Organized, social, and here for the long run."},
    {title:"Global Launch Approaching",date:"SEP 27, 2026",cat:"AION 2",excerpt:"Prepare your packs, launch groups, and voice comms. The first push begins soon."},
    {title:"Raid Command Forming",date:"SEP 25, 2026",cat:"OPERATIONS",excerpt:"Progression teams and launch-week objectives are being organized now."}
  ],
  raids:[
    {date:"SEP 30",name:"Early Access Launch Night",time:"7:00 PM CT",status:"MAIN EVENT"},
    {date:"OCT 1",name:"Progression Runs",time:"8:00 PM CT",status:"SIGNUPS OPEN"}
  ],
  roster:[
    {name:"Vaestrix",role:"Guild Leader",className:"Templar",interest:"Both"}
  ],
  settings:{discord:"https://discord.gg/docgotgame",server:"Zikel • NA East",recruitment:"Open"}
};

const esc=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

function formatDate(v){
  if(!v)return "";
  const d=new Date(v+"T12:00:00");
  if(Number.isNaN(d.getTime()))return v;
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}).toUpperCase();
}

function renderPublic(data){
  const discord=data.settings?.discord||data.discord||FALLBACK.discord;
  document.querySelectorAll("[data-discord]").forEach(a=>a.href=discord);

  const ng=document.querySelector("#news-grid");
  if(ng){
    const news=(data.news||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    ng.innerHTML=news.map(x=>`<article class="card"><div class="meta">${esc(x.category||x.cat||"GUILD")} • ${esc(formatDate(x.date))}</div><h3>${esc(x.title)}</h3><p>${esc(x.excerpt||"")}</p></article>`).join("");
  }

  const rl=document.querySelector("#raid-list");
  if(rl){
    rl.innerHTML=(data.raids||[]).map(x=>`<div class="raid-row">
      <div class="raid-date">${esc(formatDate(x.date))}</div>
      <div><strong>${esc(x.name)}</strong><small class="raid-signup-count">${x.allowSignups ? esc(x.signupCount||0)+" signed up" : "Roster signup closed"}</small></div>
      <div>${esc(x.time)}</div>
      <div class="raid-status">${esc(x.status)}</div>
      <div class="raid-action">${x.allowSignups ? `<button class="btn btn-purple raid-signup-btn" data-raid-signup="${esc(x.id)}" data-raid-name="${esc(x.name)}">Sign Up</button>` : '<span class="raid-closed">Closed</span>'}</div>
    </div>`).join("");
  }

  const rg=document.querySelector("#roster-grid");
  if(rg){
    const roleGroup=r=>{
      const v=String(r||"").toLowerCase();
      if(v==="guild leader"||v==="gl")return "Guild Leader";
      if(v==="officer")return "Officers";
      return "Members";
    };
    const roleRank=g=>g==="Guild Leader"?0:g==="Officers"?1:2;
    const roster=(data.roster||[]).slice().sort((a,b)=>{
      const ga=roleGroup(a.role), gb=roleGroup(b.role);
      return roleRank(ga)-roleRank(gb)||String(a.name||"").localeCompare(String(b.name||""));
    });
    const groups=["Guild Leader","Officers","Members"];
    rg.innerHTML=groups.map(group=>{
      const members=roster.filter(x=>roleGroup(x.role)===group);
      if(!members.length)return "";
      return `<section class="roster-group">
        <div class="roster-group-head">
          <p class="eyebrow">${group==="Guild Leader"?"COMMAND":group.toUpperCase()}</p>
          <h3>${esc(group)}</h3>
          <span>${members.length} ${members.length===1?"member":"members"}</span>
        </div>
        <div class="roster-group-grid">
          ${members.map(x=>`<article class="card member">
            <div class="avatar">${esc((x.name||"?").slice(0,1))}</div>
            <h3>${esc(x.name)}</h3>
            <div class="role">${esc(x.role||"Member")}</div>
            <div class="member-meta">${esc(x.className||"Unspecified")} • ${esc(x.interest||"Both")}</div>
          </article>`).join("")}
        </div>
      </section>`;
    }).join("");
  }
}

async function hydrate(){
  try{
    const r=await fetch("/api/public-data",{cache:"no-store"});
    if(!r.ok)throw new Error("public data unavailable");
    const data=await r.json();
    renderPublic(data);
  }catch{
    renderPublic(FALLBACK);
  }
}

document.querySelector("[data-nav-toggle]")?.addEventListener("click",()=>document.querySelector("[data-nav]")?.classList.toggle("open"));

(()=>{const path=(location.pathname.split("/").pop()||"index.html").toLowerCase();document.querySelectorAll(".main-nav a").forEach(a=>{const href=(a.getAttribute("href")||"").toLowerCase();if(href===path||(path===""&&href==="index.html"))a.classList.add("active")});})();

document.querySelectorAll(".card,.panel,.raid-hero-card,.news-feature,.leader-card,.join-art-panel,.identity-banner-wide,.recruitment-board,.war-room").forEach(el=>{el.addEventListener("pointermove",e=>{const r=el.getBoundingClientRect();el.style.setProperty("--px",((e.clientX-r.left)/r.width*100).toFixed(1)+"%");el.style.setProperty("--py",((e.clientY-r.top)/r.height*100).toFixed(1)+"%")});});

hydrate();