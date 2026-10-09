(()=> {
  const navToggle=document.querySelector("[data-nav-toggle]");
  const nav=document.querySelector("[data-nav]");
  navToggle?.addEventListener("click",()=>nav?.classList.toggle("open"));

  const glow=document.querySelector("[data-cursor-glow]");
  if(glow && matchMedia("(hover:hover) and (pointer:fine)").matches){
    window.addEventListener("pointermove",e=>{
      glow.style.left=e.clientX+"px";
      glow.style.top=e.clientY+"px";
    },{passive:true});
  }else if(glow){glow.remove();}

  const revealEls=[...document.querySelectorAll(".reveal")];
  if("IntersectionObserver" in window){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },{threshold:.12,rootMargin:"0px 0px -30px 0px"});
    revealEls.forEach(el=>io.observe(el));
  }else{
    revealEls.forEach(el=>el.classList.add("in"));
  }

  document.querySelectorAll(".btn").forEach(btn=>{
    btn.addEventListener("pointermove",e=>{
      const r=btn.getBoundingClientRect();
      btn.style.setProperty("--mx",((e.clientX-r.left)/r.width*100).toFixed(1)+"%");
      btn.style.setProperty("--my",((e.clientY-r.top)/r.height*100).toFixed(1)+"%");
    },{passive:true});
  });

  const quoteBoxes=[...document.querySelectorAll("[data-quote]")];
  const quoteTotal=document.querySelector("[data-quote-total]");
  function updateQuote(){
    if(!quoteTotal)return;
    const total=quoteBoxes.reduce((sum,x)=>sum+(x.checked?Number(x.value||0):0),0);
    quoteTotal.textContent="$"+total.toLocaleString();
  }
  quoteBoxes.forEach(x=>x.addEventListener("change",updateQuote));
  updateQuote();

  const projectForm=document.getElementById("project-form");
  const projectStatus=document.querySelector("[data-project-status]");
  projectForm?.addEventListener("submit",async e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(projectForm));
    const brief=[
      "OBSIDIAN REIGN STUDIOS - PROJECT BRIEF",
      "",
      "Creator / Channel: "+(data.name||""),
      "Email: "+(data.email||""),
      "Platform: "+(data.platform||""),
      "Budget: "+(data.budget||""),
      "",
      "STYLE / VIBE",
      data.vibe||"",
      "",
      "WHAT TO BUILD",
      data.scope||""
    ].join("\n");

    try{
      await navigator.clipboard.writeText(brief);
      if(projectStatus)projectStatus.textContent="Project brief created and copied to your clipboard. We can connect this form to email/CRM next.";
    }catch{
      if(projectStatus)projectStatus.textContent="Project brief created. Copy the information above and send it with your inquiry.";
    }
  });

  const cinematicHero=document.querySelector(".hero-cinematic");
  const artColumn=document.querySelector(".hero-art-column");
  if(cinematicHero && artColumn && matchMedia("(hover:hover) and (pointer:fine)").matches){
    cinematicHero.addEventListener("pointermove",e=>{
      const r=cinematicHero.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      artColumn.style.transform="translate3d("+(x*12).toFixed(1)+"px,"+(y*8).toFixed(1)+"px,0)";
    },{passive:true});
    cinematicHero.addEventListener("pointerleave",()=>artColumn.style.transform="");
  }

  const header=document.querySelector(".site-header");
  let lastY=0;
  const onScroll=()=>{
    const y=window.scrollY||0;
    header?.classList.toggle("scrolled",y>18);
    lastY=y;
  };
  onScroll();
  window.addEventListener("scroll",onScroll,{passive:true});
})();