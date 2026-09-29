(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced)return;
const hero=document.querySelector('.hero');if(hero){
  const layer=document.createElement('div');layer.className='ember-field';hero.appendChild(layer);
  for(let i=0;i<42;i++){const s=document.createElement('i');s.style.setProperty('--x',(Math.random()*100)+'%');s.style.setProperty('--d',(6+Math.random()*10)+'s');s.style.setProperty('--delay',(-Math.random()*12)+'s');s.style.setProperty('--size',(1+Math.random()*2.8)+'px');s.style.setProperty('--drift',(-45+Math.random()*90)+'px');layer.appendChild(s)}
  hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;hero.style.setProperty('--mx',x.toFixed(3));hero.style.setProperty('--my',y.toFixed(3));});
}
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('reveal-in')}),{threshold:.12});
document.querySelectorAll('.section,.quicklinks,.join-banner,.card,.panel').forEach(el=>{el.classList.add('reveal');io.observe(el)});
})();