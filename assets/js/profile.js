(()=> {
  const form=document.getElementById("member-profile-form");
  const account=document.getElementById("profile-account");
  const status=document.getElementById("profile-save-status");
  if(!form||!account)return;

  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}

  async function load(){
    const r=await fetch("/api/profile",{cache:"no-store",credentials:"same-origin"});
    if(r.status===401){
      location.href="/auth/discord";
      return;
    }
    const data=await r.json();
    if(!r.ok)throw new Error(data.error||"Could not load profile.");

    const u=data.user||{};
    account.innerHTML=`
      <p class="eyebrow">DISCORD ACCOUNT</p>
      <div class="profile-discord-user">
        ${u.avatarUrl?'<img src="'+esc(u.avatarUrl)+'" alt="">':""}
        <div><strong>${esc(u.globalName||u.username||"Discord User")}</strong><small>@${esc(u.username||"")}</small></div>
      </div>
      <div class="profile-link-state ${data.linked?"is-linked":"is-unlinked"}">
        <b>${data.linked?"ROSTER LINKED":"PROFILE NOT LINKED TO ROSTER"}</b>
        <span>${data.linked?"Changes here update your guild roster entry and class statistics immediately.":"Your profile can be saved, but it will not change the public roster until an officer links or accepts your Discord-authenticated application."}</span>
      </div>`;

    const source=data.profile||data.member;
    if(source){
      form.name.value=source.name||"";
      form.className.value=source.className||"";
      form.interest.value=source.interest||"Both";
    }
  }

  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const btn=form.querySelector('button[type="submit"]');
    btn.disabled=true;
    status.textContent="Saving…";
    status.className="profile-save-status";

    try{
      const r=await fetch("/api/profile",{
        method:"POST",
        credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const data=await r.json();
      if(!r.ok)throw new Error(data.error||"Could not save profile.");
      status.className="profile-save-status profile-success";
      status.textContent=data.linked
        ?"Profile saved. Your roster entry and class statistics are now updated."
        :"Profile saved. An officer still needs to link this Discord account to your roster entry.";
      await load();
    }catch(err){
      status.className="profile-save-status profile-error";
      status.textContent=err.message;
    }finally{
      btn.disabled=false;
    }
  });

  load().catch(err=>{
    status.className="profile-save-status profile-error";
    status.textContent=err.message;
  });
})();