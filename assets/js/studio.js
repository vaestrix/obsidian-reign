(()=> {
  const navToggle=document.querySelector("[data-nav-toggle]");
  const nav=document.querySelector("[data-nav]");
  navToggle?.addEventListener("click",()=>nav?.classList.toggle("open"));

  const glow=document.querySelector("[data-cursor-glow]");
  let sparkFrame=0;
  let lastSpark=0;
  const sparkleColors=["dot","star"];
  if(matchMedia("(hover:hover) and (pointer:fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches){
    window.addEventListener("pointermove",e=>{
      const now=performance.now();
      if(now-lastSpark<34)return;
      lastSpark=now;
      const s=document.createElement("i");
      s.className="cursor-spark "+(sparkFrame++%5===0?"star":"");
      s.style.left=e.clientX+"px";
      s.style.top=e.clientY+"px";
      const angle=(sparkFrame*47)%360*Math.PI/180;
      const dist=8+(sparkFrame%4)*2;
      s.style.setProperty("--dx",(Math.cos(angle)*dist).toFixed(1)+"px");
      s.style.setProperty("--dy",(Math.sin(angle)*dist-10).toFixed(1)+"px");
      document.body.appendChild(s);
      setTimeout(()=>s.remove(),760);
    },{passive:true});
  }
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
  let addonTotal=0;
  function updateQuote(){
    if(!quoteTotal)return;
    const total=quoteBoxes.reduce((sum,x)=>sum+(x.checked?Number(x.value||0):0),0)+addonTotal;
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
      [
        data.want_streamkit?"Stream Kit":"",
        data.want_emotes?"Emotes / Badges":"",
        data.want_cinematics?"Cinematics / Trailer":"",
        data.want_audio?"Music / Voice":"",
        data.want_branding?"Branding / Logo":"",
        data.want_site?"Creator Website":""
      ].filter(Boolean).join(", ") || "Not selected",
      "",
      "GOAL / SUCCESS",
      data.scope||"",
      "",
      "LINKS / REFERENCES",
      data.refs||""
    ].join("\n");

    const emailLink=document.querySelector("[data-project-email]");
    if(emailLink){
      emailLink.href="mailto:savannah@obsidianreign.gg?subject="+encodeURIComponent("Creator project inquiry")+"&body="+encodeURIComponent(brief);
      emailLink.hidden=false;
    }

    try{
      await navigator.clipboard.writeText(brief);
      if(projectStatus)projectStatus.textContent="Your brief is copied. Email it to Savannah using the button below. Nothing has been sent yet.";
    }catch{
      if(projectStatus)projectStatus.textContent="Your brief is ready. Use the button below to open it in your email app, then review and send. Nothing has been sent yet.";
    }
  });

  const heroVideo=document.querySelector("[data-hero-video]");
  if(heroVideo){
    const syncVideo=()=>{
      if(document.hidden){heroVideo.pause();}
      else{heroVideo.play().catch(()=>{});}
    };
    document.addEventListener("visibilitychange",syncVideo);
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){heroVideo.pause();}
  }

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

  const accentTargets=[...document.querySelectorAll(".section,.cta,.founder-section")];
  const accentGlyphs=[
    {t:"✦",c:""},
    {t:"♡",c:""},
    {t:"✧",c:"alt"},
    {t:"⋆",c:"gold"}
  ];
  accentTargets.forEach((section,idx)=>{
    if(section.querySelector(".cute-float"))return;
    const count=idx%2===0?2:1;
    for(let i=0;i<count;i++){
      const g=accentGlyphs[(idx+i)%accentGlyphs.length];
      const el=document.createElement("span");
      el.className="cute-float "+g.c;
      el.textContent=g.t;
      el.style.left=(8+((idx*19+i*33)%82))+"%";
      el.style.top=(12+((idx*23+i*17)%72))+"%";
      el.style.animationDelay=(-((idx+i)%5)*1.3)+"s";
      section.appendChild(el);
    }
  });

  const header=document.querySelector(".site-header");
  let lastY=0;
  const onScroll=()=>{
    const y=window.scrollY||0;
    header?.classList.toggle("scrolled",y>18);
    lastY=y;
  };
  onScroll();
  window.addEventListener("scroll",onScroll,{passive:true});
  const baSlider=document.querySelector("[data-ba-slider]");
  const baAfter=document.querySelector("[data-ba-after]");
  const baDivider=document.querySelector("[data-ba-divider]");
  const syncBA=()=>{if(!baSlider||!baAfter||!baDivider)return;const v=Number(baSlider.value||50);baAfter.style.clipPath="inset(0 0 0 "+v+"%)";baDivider.style.left=v+"%";};
  baSlider?.addEventListener("input",syncBA); syncBA();

  const vibeButtons=[...document.querySelectorAll("[data-vibe]")];
  const vibePreview=document.querySelector("[data-vibe-preview]");
  const vibeLabel=document.querySelector("[data-vibe-label]");
  const vibeLink=document.querySelector("[data-vibe-link]");
  vibeButtons.forEach(btn=>btn.addEventListener("click",()=>{
    vibeButtons.forEach(x=>x.classList.remove("active"));btn.classList.add("active");
    const vibe=btn.dataset.vibe||"Custom"; if(vibePreview)vibePreview.dataset.tone=btn.dataset.tone||"violet";
    if(vibeLabel)vibeLabel.textContent=vibe.toUpperCase();
    if(vibeLink)vibeLink.href="start-project.html?vibe="+encodeURIComponent(vibe);
  }));

  const showroomTitle=document.querySelector("[data-showroom-title]");
  const showroomSub=document.querySelector("[data-showroom-sub]");
  const showroomAlert=document.querySelector("[data-showroom-alert]");
  const showroomStage=document.querySelector("[data-showroom-stage]");
  const showroomEvents={
    follow:["NEW FOLLOWER","A new viewer just entered your world.","✦ NEW FOLLOW • WELCOME IN"],
    sub:["NEW SUBSCRIBER","Make support feel like an event, not a popup.","♡ SUBSCRIBER UNLOCKED • THANK YOU"],
    raid:["INCOMING RAID","Turn community moments into miniature cinematics.","⚡ RAID INBOUND • OPEN THE GATES"],
    voice:["VOICE CHAOS","Custom character lines can turn alerts into recurring jokes.","☠ VOICE PACK • CHAOS ACTIVATED"],
    stinger:["SCENE TRANSITION","One visual language from gameplay to BRB to ending.","✧ CINEMATIC STINGER • SCENE SHIFT"]
  };
  document.querySelectorAll("[data-show]").forEach(btn=>btn.addEventListener("click",()=>{
    const [title,sub,alert]=showroomEvents[btn.dataset.show]||showroomEvents.follow;
    if(showroomTitle)showroomTitle.textContent=title;if(showroomSub)showroomSub.textContent=sub;
    if(showroomAlert){showroomAlert.classList.remove("play");void showroomAlert.offsetWidth;showroomAlert.textContent=alert;showroomAlert.classList.add("play");}
    showroomStage?.animate([{filter:"brightness(1) saturate(1)"},{filter:"brightness(1.18) saturate(1.18)"},{filter:"brightness(1) saturate(1)"}],{duration:700,easing:"ease-out"});
  }));

  const auditForm=document.querySelector("[data-audit-form]");
  const auditStatus=document.querySelector("[data-audit-status]");
  auditForm?.addEventListener("submit",async e=>{
    e.preventDefault();const d=Object.fromEntries(new FormData(auditForm));
    const payload=["OBSIDIAN REIGN STUDIOS - FREE CREATOR AUDIT REQUEST","","Channel: "+(d.channel||""),"Email: "+(d.email||""),"Primary goal: "+(d.goal||"")].join("\n");
    try{await navigator.clipboard.writeText(payload);if(auditStatus)auditStatus.textContent="Audit request prepared and copied. Direct studio inbox delivery is being connected next.";}
    catch{if(auditStatus)auditStatus.textContent="Audit request prepared. Direct submission will be connected to the studio inbox.";}
  });

  const quiz=document.querySelector("[data-quiz]");
  const quizQ=document.querySelector("[data-quiz-question]");
  const quizResult=document.querySelector("[data-quiz-result]");
  let quizStep=0; const quizScores={glam:0,cozy:0,chaos:0,dark:0};
  const quizQuestions=[
    {q:"What should viewers feel in the first five seconds?",a:[["glam","“This looks expensive.”"],["cozy","“I want to hang out here.”"],["chaos","“What on earth is happening?”"],["dark","“This creator has lore.”"]]},
    {q:"What kind of alert would make you happiest?",a:[["glam","A gorgeous cinematic reveal"],["cozy","A cute character waving hello"],["chaos","A completely unhinged voice line"],["dark","A dramatic ritual-like animation"]]},
    {q:"Pick the compliment you want most.",a:[["glam","“Your brand is flawless.”"],["cozy","“Your community feels like home.”"],["chaos","“I clipped that immediately.”"],["dark","“Your stream has its own universe.”"]]}
  ];
  const quizProfiles={
    glam:["THE MAIN CHARACTER","Polished, confident, glamorous. Your strongest direction is cinematic motion, alt-girl glam, premium alerts, and a brand that feels expensive.","Fan Service / Glam"],
    cozy:["THE COZY MENACE","Warm, cute, community-first, with a gamer-girl edge. Think personality-rich emotes, soft motion, funny alerts, and cozy neon.","Cozy"],
    chaos:["THE CHAOS GOBLIN","Your brand should create clips by itself. Voice packs, absurd alerts, mascot bits, reactive emotes, and high-energy transitions fit you.","Chaos / Comedy"],
    dark:["THE LOREKEEPER","Atmosphere is the product. Goth visuals, cinematics, custom music, and a world that feels bigger than the stream itself.","Dark Fantasy"]
  };
  function renderQuiz(){if(!quizQ||!quizResult)return;if(quizStep>=quizQuestions.length){const key=Object.entries(quizScores).sort((a,b)=>b[1]-a[1])[0][0];const [title,copy,vibe]=quizProfiles[key];quizQ.hidden=true;quizResult.hidden=false;quizResult.innerHTML="<small>YOUR CREATOR TYPE</small><strong>"+title+"</strong><p>"+copy+"</p><a class='btn btn-primary' href='start-project.html?vibe="+encodeURIComponent(vibe)+"'>BUILD MY "+vibe.toUpperCase()+" DIRECTION</a>";return;}const item=quizQuestions[quizStep];quizQ.innerHTML="<small>QUESTION "+(quizStep+1)+" OF "+quizQuestions.length+"</small><h3>"+item.q+"</h3><div class='quiz-options'>"+item.a.map(([k,t])=>"<button data-quiz-answer='"+k+"'>"+t+"</button>").join("")+"</div>";quizQ.querySelectorAll("[data-quiz-answer]").forEach(b=>b.addEventListener("click",()=>{quizScores[b.dataset.quizAnswer]++;quizStep++;renderQuiz();}));}
  if(quiz)renderQuiz();

  const addonButtons=[...document.querySelectorAll("[data-add-quote]")];
  addonButtons.forEach(btn=>btn.addEventListener("click",()=>{
    btn.classList.toggle("active");addonTotal=addonButtons.reduce((s,b)=>s+(b.classList.contains("active")?Number(b.dataset.addQuote||0):0),0);
    if(quoteTotal){const base=quoteBoxes.reduce((sum,x)=>sum+(x.checked?Number(x.value||0):0),0);quoteTotal.textContent="$"+(base+addonTotal).toLocaleString();}
  }));
  // Prefill project intake from package, vibe, and Surprise Me links
  const params=new URLSearchParams(location.search);
  const projectFormEl=document.getElementById("project-form");
  if(projectFormEl){
    const vibeField=projectFormEl.querySelector('[name="vibe"]');
    const budgetField=projectFormEl.querySelector('[name="budget"]');
    const scopeField=projectFormEl.querySelector('[name="scope"]');
    const modeNote=document.querySelector("[data-project-mode-note]");
    const vibeParam=params.get("vibe");
    const packageParam=params.get("package");
    const modeParam=params.get("mode");
    if(vibeParam && vibeField && !vibeField.value){
      vibeField.value=vibeParam;
    }
    const packageMap={
      starter:["$300–$600","I'm interested in the Reign Starter package."],
      ascension:["$600–$1,200","I'm interested in the Creator Ascension package."],
      cinematic:["$1,200–$2,500","I'm interested in the Cinematic Reign package."],
      dominion:["$2,500+","I'm interested in the Creator Dominion package."]
    };
    if(packageParam && packageMap[packageParam]){
      const [budget,scope]=packageMap[packageParam];
      if(budgetField)budgetField.value=budget;
      if(scopeField && !scopeField.value)scopeField.value=scope;
    }
    if(modeParam==="surprise"){
      if(modeNote)modeNote.innerHTML="<strong>♡ SURPRISE ME MODE</strong><span>Tell us who you are, what you stream, and what you want people to feel. We will propose the creative direction.</span>";
      if(vibeField && !vibeField.value)vibeField.placeholder="You do not need to choose a style. Tell us your personality, favorite games, colors you love or hate, and what feels like you.";
      if(scopeField && !scopeField.value)scopeField.placeholder="Tell us what feels weak or unfinished about your current channel. We will recommend the creative system.";
    }
  }
})();
