/* Public demonstration media: silent, visible-only playback and native looping. */
(async()=>{
 let manifest;try{const response=await fetch('/assets/js/preview-loop-manifest.json?v=site-loops-20261027');if(!response.ok)return;manifest=await response.json();}catch{return;}
 const states=new Map(),motion=matchMedia('(prefers-reduced-motion: reduce)');
 const visible=video=>!video.hidden&&!video.closest('[hidden]')&&video.getClientRects().length>0;
 function soundLabel(video){if(video.matches('[data-alert-video]')){const button=document.querySelector('[data-demo-sound]');if(button){button.textContent=video.muted?'Enable sound':'Mute sound';button.setAttribute('aria-pressed',String(!video.muted));}}}
 function stop(video,state){state.visible=false;video.pause();video.muted=true;soundLabel(video);}
 function play(video,state){if(!state.visible||!visible(video)||state.manual||document.hidden||motion.matches||navigator.connection?.saveData)return;video.play().catch(()=>{});}
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(entry=>{const video=entry.target,state=states.get(video);if(!state)return;const active=entry.isIntersecting&&entry.intersectionRatio>=.25&&visible(video);if(active===state.visible)return;if(active){state.visible=true;play(video,state);}else stop(video,state);}),{threshold:[0,.25]}):null;
 function register(video){
  if(video.matches('[data-feature-video]'))return;
  video.closest('.showroom')?.style.setProperty('overflow','clip');
  const source=video.querySelector('source'),raw=video.getAttribute('src')||source?.getAttribute('src');if(!raw)return;
  let path;try{path=new URL(raw,location.href).pathname;}catch{return;}
  const known=manifest[path]||Object.values(manifest).includes(path)||path.startsWith('/assets/video/after-dark-')&&path.endsWith('.webm');if(!known)return;
  let state=states.get(video);if(!state){state={visible:false,manual:false,loading:false,userIntent:false,source:''};states.set(video,state);video.muted=true;video.playsInline=true;video.loop=true;video.addEventListener('pause',()=>{if(state.userIntent&&!state.loading&&video.readyState>=2&&state.visible&&visible(video)&&!document.hidden&&!motion.matches&&!video.ended)state.manual=true;});video.addEventListener('pointerdown',()=>{state.userIntent=!video.paused;});video.addEventListener('keydown',event=>{if([' ','Enter','k'].includes(event.key))state.userIntent=!video.paused;});const playButton=video.closest('.selection-film')?.querySelector('.selection-film-button')||video.closest('[data-after-dark-suite]')?.querySelector('[data-asset-play]')||(video.matches('[data-alert-video]')?document.querySelector('[data-demo-motion]'):null);playButton?.addEventListener('click',()=>{state.userIntent=!video.paused;},true);video.addEventListener('play',()=>{state.manual=false;state.userIntent=false;});video.addEventListener('loadstart',()=>{state.loading=true;state.manual=false;video.muted=true;soundLabel(video);});video.addEventListener('loadeddata',()=>{state.loading=false;play(video,state);});observer?.observe(video);}
  const target=manifest[path]||path;if(state.source!==target){state.source=target;state.manual=false;state.loading=true;video.muted=true;soundLabel(video);if(path!==target){if(video.hasAttribute('src'))video.src=target;else source.src=target;video.load();}play(video,state);}
 }
 function scan(){document.querySelectorAll('video').forEach(register);}
 scan();new MutationObserver(records=>{if(records.some(record=>record.type==='attributes'&&record.attributeName==='hidden'))states.forEach((state,video)=>{if(!visible(video))stop(video,state);else state.manual=false;});scan();}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','hidden']});
 document.addEventListener('visibilitychange',()=>states.forEach((state,video)=>{if(document.hidden){video.pause();video.muted=true;soundLabel(video);}else play(video,state);}));
 motion.addEventListener('change',()=>states.forEach((state,video)=>{if(motion.matches){video.pause();video.muted=true;soundLabel(video);}else play(video,state);}));
})();
