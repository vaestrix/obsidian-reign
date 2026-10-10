(()=> {
  const navToggle=document.querySelector("[data-nav-toggle]");
  const nav=document.querySelector("[data-nav]");
  navToggle?.setAttribute("aria-expanded","false");
  navToggle?.addEventListener("click",()=>{const open=nav?.classList.toggle("open");navToggle.setAttribute("aria-expanded",String(Boolean(open)));navToggle.setAttribute("aria-label",open?"Close navigation":"Open navigation");});

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
    follow:["NEW FOLLOWER","A clear animated notification for new followers.","NEW FOLLOWER • THANK YOU"],
    sub:["NEW SUBSCRIBER","Make support feel like an event, not a popup.","NEW SUBSCRIBER • THANK YOU"],
    raid:["INCOMING RAID","Turn community moments into miniature cinematics.","INCOMING RAID"],
    voice:["VOICE CHAOS","Custom character lines can turn alerts into recurring jokes.","CUSTOM VOICE ALERT"],
    stinger:["SCENE TRANSITION","One visual language from gameplay to BRB to ending.","SCENE TRANSITION"]
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
    const emailLink=document.querySelector("[data-audit-email]");
    if(emailLink){emailLink.href="mailto:savannah@obsidianreign.gg?subject="+encodeURIComponent("Creator audit request")+"&body="+encodeURIComponent(payload);emailLink.hidden=false;}
    try{await navigator.clipboard.writeText(payload);if(auditStatus)auditStatus.textContent="Request copied. Open the email below, review it, and send it to Savannah.";}
    catch{if(auditStatus)auditStatus.textContent="Request ready. Open the email below, review it, and send it to Savannah.";}
  });

  const quiz=document.querySelector("[data-quiz]");
  const quizQ=document.querySelector("[data-quiz-question]");
  const quizResult=document.querySelector("[data-quiz-result]");
  let quizStep=0; const quizScores={glam:0,cozy:0,chaos:0,dark:0};
  const quizQuestions=[
    {q:"What should viewers feel in the first five seconds?",a:[["glam","“This looks expensive.”"],["cozy","“I want to hang out here.”"],["chaos","“What on earth is happening?”"],["dark","“This stream has a strong theme.”"]]},
    {q:"What kind of alert would make you happiest?",a:[["glam","A gorgeous cinematic reveal"],["cozy","A cute character waving hello"],["chaos","A completely unhinged voice line"],["dark","A dramatic cinematic animation"]]},
    {q:"Pick the compliment you want most.",a:[["glam","“Your brand is flawless.”"],["cozy","“Your community feels like home.”"],["chaos","“I clipped that immediately.”"],["dark","“Your stream has a distinctive style.”"]]}
  ];
  const quizProfiles={
    glam:["THE MAIN CHARACTER","Polished, confident, glamorous. Your strongest direction is cinematic motion, alt-girl glam, premium alerts, and a brand that feels expensive.","Fan Service / Glam"],
    cozy:["THE COZY MENACE","Warm, cute, community-first, with a gamer-girl edge. Think personality-rich emotes, soft motion, funny alerts, and cozy neon.","Cozy"],
    chaos:["THE CHAOS GOBLIN","Your brand should create clips by itself. Voice packs, absurd alerts, mascot bits, reactive emotes, and high-energy transitions fit you.","Chaos / Comedy"],
    dark:["THE CINEMATIC CREATOR","A strong theme ties your stream together. Dark visuals, animated scenes, and custom music give your channel a consistent atmosphere.","Dark Fantasy"]
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

// Scene directions change the artwork, palette, copy and alert together.
(()=>{
 const profiles={
 violet:['◇','After-hours neon.','Prismatic light. Glossy chrome. Electric confidence.','A neon-lit scene family with holographic borders, luminous transitions, and jewel-toned alerts.','Violet / Electric pink / Ice blue','✦ A little extra sparkle for every new subscriber.','#a467ff','#fa68d4','#79e7ff','Chrome & neon'],
 goth:['☾','Velvet after midnight.','Moonlight. Gothic arches. A little beautiful darkness.','Cathedral-inspired framing, a crimson moon, drifting mist, and elegant silver details.','Black plum / Crimson / Moon silver','☾ A new soul joins the night.','#36203f','#c33d69','#d8c9ea','Moonlit & dramatic'],
 kawaii:['♡','Sweet, with a sparkle.','Candy clouds. Heart confetti. Main-character joy.','Bubblegum colors, floating hearts, soft cloud shapes, and playful subscriber moments.','Candy pink / Lilac / Mint cream','♡ Another sweet little reason to celebrate.','#ff9bd5','#b6a1ff','#a8eedc','Candy & cloud-soft'],
 fantasy:['✧','Enter another world.','Arcane portals. Ember dust. Epic anticipation.','A glowing rune portal anchors your scenes with layered peaks, magical particles, and ornate alert framing.','Arcane violet / Ember gold / Deep indigo','✧ A new adventurer has entered the party.','#8361dc','#efbf7e','#202346','Arcane & cinematic'],
 glam:['✦','Make an entrance.','Rose-gold spotlights. Satin curves. Spotlight energy.','Sculpted light ribbons and a glamorous jewel centerpiece give every scene a confident, polished presence.','Hot rose / Champagne / Aubergine','✦ The spotlight just got a little brighter.','#e85ca6','#f2d5aa','#47263f','Satin & spotlight'],
 cozy:['☕','Stay a little longer.','Warm windows. Gentle rain. Your favorite corner.','Amber window light, layered room shapes, and warm, gentle alert moments for a relaxed community space.','Honey / Warm mauve / Cream','☕ There is always room for one more.','#dfa969','#a37b96','#f2ddbc','Warm & welcoming'],
 horror:['†','Something is stirring.','Crimson fog. Broken silhouettes. Slow suspense.','A moody red horizon, distorted framing, and atmospheric alert reveals without rapid flashing.','Blood red / Charcoal / Mist gray','† You heard that too, right?','#be4658','#272329','#b4a6ad','Fog & suspense'],
 luxury:['◈','Quietly unforgettable.','Fine gold lines. Sculptural forms. Intentional space.','A restrained champagne-and-obsidian direction with precise frames and an elegant monogram-inspired focal point.','Champagne / Obsidian / Ivory','◈ A moment worth celebrating.','#d8bd7c','#19171f','#ece3d5','Sculptural & refined'],
 chaos:['★','Expect the unexpected.','Sticker energy. Pop-art shapes. Controlled mayhem.','Bright layered shapes, playful tilts, and punchy alert moments that match a lively comedy-driven channel.','Lime / Punch pink / Electric violet','★ Plot twist: the community got bigger.','#cce974','#ef79b6','#9770e8','Pop art & playful']
 };
 const preview=document.querySelector('[data-vibe-preview]');if(!preview)return;
 const buttons=[...document.querySelectorAll('[data-vibe]')];
 function update(btn){const p=profiles[btn.dataset.tone];if(!p)return;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));preview.style.setProperty('--direction-a',p[6]);preview.style.setProperty('--direction-b',p[7]);preview.style.setProperty('--direction-c',p[8]);[['symbol',0],['title',1],['sub',2],['description',3],['palette',4],['alert',5]].forEach(([key,i])=>{const el=preview.querySelector('[data-direction-'+key+']');if(el)el.textContent=p[i];});}
 buttons.forEach(btn=>{const title=document.createElement('strong');title.textContent=btn.textContent;const note=document.createElement('small');note.textContent=profiles[btn.dataset.tone][9];btn.replaceChildren(title,note);btn.addEventListener('click',()=>update(btn));});update(buttons[0]);
 const video=document.querySelector('[data-alert-video]'),pause=document.querySelector('[data-demo-motion]'),stage=document.querySelector('[data-showroom-stage]');
 if(video&&pause){pause.textContent='Play video';pause.addEventListener('click',async()=>{if(video.paused){try{await video.play();pause.textContent='Pause video';}catch{pause.textContent='Try video again';}}else{video.pause();pause.textContent='Play video';}});video.addEventListener('ended',()=>pause.textContent='Replay video');video.addEventListener('error',()=>{pause.textContent='Video unavailable';});document.querySelectorAll('[data-show]').forEach(btn=>btn.addEventListener('click',async()=>{stage.dataset.event=btn.dataset.show;document.querySelectorAll('[data-show]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));video.currentTime=0;try{await video.play();pause.textContent='Pause video';}catch{pause.textContent='Play video';}}));}
})();
