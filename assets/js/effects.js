(()=> {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero=document.querySelector('.video-hero');

  if(hero && !reduced){
    let raf=0;
    hero.addEventListener('pointermove',e=>{
      const r=hero.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width;
      const y=(e.clientY-r.top)/r.height;
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{
        hero.style.setProperty('--hero-x',(x*100).toFixed(2)+'%');
        hero.style.setProperty('--hero-y',(y*100).toFixed(2)+'%');
        hero.style.setProperty('--hero-shift-x',((x-.5)*10).toFixed(2)+'px');
        hero.style.setProperty('--hero-shift-y',((y-.5)*5).toFixed(2)+'px');
      });
    });
    hero.addEventListener('pointerleave',()=>{
      hero.style.setProperty('--hero-x','62%');
      hero.style.setProperty('--hero-y','72%');
      hero.style.setProperty('--hero-shift-x','0px');
      hero.style.setProperty('--hero-shift-y','0px');
    });
  }

  if(reduced)return;

  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('reveal-in');
        io.unobserve(entry.target);
      }
    });
  },{threshold:.12,rootMargin:'0px 0px -40px 0px'});

  document.querySelectorAll('.section,.live-intel,.join-banner,.card,.panel,.recruitment-board,.war-room,.raid-hero-card,.news-feature,.leader-card,.join-art-panel,.identity-banner-wide,.admin-raid-card,.application-card')
    .forEach((el,i)=>{
      el.classList.add('reveal');
      el.style.setProperty('--reveal-delay',Math.min((i%5)*55,220)+'ms');
      io.observe(el);
    });

  if(matchMedia('(hover:hover) and (pointer:fine)').matches){
    document.querySelectorAll('.btn,.text-link,.recruit-card,.video-hero-links a').forEach(el=>{
      el.addEventListener('pointermove',e=>{
        const r=el.getBoundingClientRect();
        el.style.setProperty('--mx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
        el.style.setProperty('--my',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
      },{passive:true});
    });
  }

  const video=document.querySelector('.video-hero-bg');
  if(video){
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){
        video.pause();
      }else{
        video.play().catch(()=>{});
      }
    });
  }
})();