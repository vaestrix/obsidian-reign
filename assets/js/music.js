(()=> {
  const audio=document.getElementById('guild-theme');
  if(!audio) return;

  const KEY="or-audio-state";
  const dock=document.querySelector('[data-music-dock]');
  const playBtn=dock?.querySelector('[data-music-toggle]')||null;
  const stateLabel=dock?.querySelector('[data-music-state]')||null;
  const volume=dock?.querySelector('[data-music-volume]')||null;
  const muteBtn=document.querySelector('[data-site-mute]');
  const muteIcon=muteBtn?.querySelector('.site-mute-icon')||null;
  const muteLabel=muteBtn?.querySelector('.site-mute-label')||null;

  let wanted=localStorage.getItem('or-music')!=='off';
  const savedVolume=Number(localStorage.getItem('or-volume')||.55);
  const savedMuted=localStorage.getItem('or-muted')==='true';
  audio.volume=Number.isFinite(savedVolume)?Math.min(1,Math.max(0,savedVolume)):.55;
  audio.muted=savedMuted;
  if(volume) volume.value=audio.volume;

  function readState(){try{return JSON.parse(sessionStorage.getItem(KEY)||"{}")}catch{return {}}}
  function persist(){
    try{
      sessionStorage.setItem(KEY,JSON.stringify({
        t:Number.isFinite(audio.currentTime)?audio.currentTime:0,
        playing:!audio.paused,
        muted:audio.muted,
        volume:audio.volume,
        savedAt:Date.now()
      }));
    }catch{}
  }

  const previous=readState();
  if(Number.isFinite(previous.volume)){
    audio.volume=Math.min(1,Math.max(0,previous.volume));
    if(volume) volume.value=audio.volume;
  }
  if(typeof previous.muted==="boolean") audio.muted=previous.muted;

  function restoreTime(){
    if(Number.isFinite(previous.t) && previous.t>0 && Number.isFinite(audio.duration) && audio.duration>0){
      audio.currentTime=Math.min(previous.t,Math.max(0,audio.duration-.25));
    }
  }
  if(audio.readyState>=1) restoreTime();
  else audio.addEventListener("loadedmetadata",restoreTime,{once:true});

  function sync(){
    if(stateLabel) stateLabel.textContent=audio.paused?'Play theme':'Theme playing';
    if(dock) dock.classList.toggle('is-playing',!audio.paused);
    if(muteBtn){
      const muted=audio.muted || audio.volume===0;
      muteBtn.classList.toggle('is-muted',muted);
      muteBtn.setAttribute('aria-pressed',String(muted));
      muteBtn.setAttribute('aria-label',muted?'Unmute site music':'Mute site music');
      if(muteIcon) muteIcon.textContent=muted?'🔇':'🔊';
      if(muteLabel) muteLabel.textContent=muted?'Muted':'Sound';
    }
  }

  async function attempt(){
    if(!wanted) return;
    try{await audio.play();}
    catch{
      if(stateLabel) stateLabel.textContent='Click to enable sound';
      dock?.classList.add('needs-gesture');
    }
    sync();
  }

  playBtn?.addEventListener('click',async()=>{
    dock?.classList.remove('needs-gesture');
    if(audio.paused){
      wanted=true; localStorage.setItem('or-music','on');
      try{await audio.play();}catch{}
    }else{
      wanted=false; localStorage.setItem('or-music','off'); audio.pause();
    }
    persist(); sync();
  });

  muteBtn?.addEventListener('click',async()=>{
    audio.muted=!audio.muted;
    localStorage.setItem('or-muted',String(audio.muted));
    if(audio.paused && wanted && !audio.muted){try{await audio.play();}catch{}}
    persist(); sync();
  });

  volume?.addEventListener('input',()=>{
    audio.volume=Number(volume.value);
    localStorage.setItem('or-volume',String(audio.volume));
    if(audio.volume>0 && audio.muted){
      audio.muted=false;
      localStorage.setItem('or-muted','false');
    }
    persist(); sync();
  });

  audio.addEventListener('timeupdate',()=>{ if(!audio.paused) persist(); });
  audio.addEventListener('play',()=>{persist();sync()});
  audio.addEventListener('pause',()=>{persist();sync()});
  audio.addEventListener('volumechange',sync);
  window.addEventListener('pagehide',persist);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persist()});

  ['pointerdown','keydown','touchstart'].forEach(ev=>{
    window.addEventListener(ev,()=>{if(wanted&&audio.paused)attempt();},{once:true,passive:true});
  });

  if(previous.playing!==false && wanted) attempt();
  sync();
})();