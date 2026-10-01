(()=> {
  const link=document.querySelector("[data-auth-link]");
  if(!link)return;

  async function load(){
    try{
      const r=await fetch("/auth/me",{cache:"no-store",credentials:"same-origin"});
      if(!r.ok)throw new Error("auth");
      const data=await r.json();

      if(!data.loggedIn || !data.user){
        link.href="/auth/discord";
        link.textContent="Login";
        link.classList.remove("is-user");
        link.removeAttribute("title");
        return;
      }

      const u=data.user;
      link.href="/auth/logout";
      link.classList.add("is-user");
      link.title="Logged in as "+(u.globalName||u.username)+" • Click to log out";
      link.innerHTML=(u.avatarUrl?'<img src="'+u.avatarUrl+'" alt="">':"")+'<span>'+(u.globalName||u.username)+'</span>';
    }catch{
      link.href="/auth/discord";
      link.textContent="Login";
    }
  }

  load();
})();