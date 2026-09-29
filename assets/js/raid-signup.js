(()=> {
  const dialog=document.getElementById("raid-signup-dialog");
  if(!dialog) return;

  const form=dialog.querySelector("#raid-signup-form");
  const title=dialog.querySelector("[data-raid-dialog-title]");
  const status=dialog.querySelector("[data-raid-signup-status]");
  const raidIdInput=form.querySelector('[name="raidId"]');
  const nameInput=form.querySelector('[name="characterName"]');
  const closeBtn=dialog.querySelector("[data-raid-dialog-close]");

  function openSignup(btn){
    raidIdInput.value=btn.dataset.raidSignup||"";
    title.textContent="Sign Up: "+(btn.dataset.raidName||"Raid Event");
    status.textContent="";
    status.className="raid-signup-message";
    nameInput.value="";
    dialog.showModal();
    setTimeout(()=>nameInput.focus(),30);
  }

  document.addEventListener("click",e=>{
    const btn=e.target.closest("[data-raid-signup]");
    if(btn) openSignup(btn);
  });

  closeBtn?.addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",e=>{
    if(e.target===dialog) dialog.close();
  });

  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const submit=form.querySelector('button[type="submit"]');
    submit.disabled=true;
    status.textContent="Checking roster…";
    status.className="raid-signup-message";

    try{
      const r=await fetch("/api/raid-signup",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const data=await r.json();

      if(!r.ok){
        status.className="raid-signup-message raid-signup-error";
        if(data.code==="NOT_ON_ROSTER"){
          status.innerHTML='Please apply to Obsidian Reign before requesting to attend a Raid. <a href="join.html">Apply to Obsidian Reign</a>.';
        }else{
          status.textContent=data.error||"Could not complete raid signup.";
        }
        return;
      }

      status.className="raid-signup-message raid-signup-success";
      status.textContent="Raid signup confirmed. You are on the roster for this event.";
      form.reset();
      setTimeout(()=>location.reload(),900);
    }catch(err){
      status.className="raid-signup-message raid-signup-error";
      status.textContent="Could not reach Legion Command. Please try again.";
    }finally{
      submit.disabled=false;
    }
  });
})();