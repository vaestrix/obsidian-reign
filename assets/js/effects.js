(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced)return;
const hero=document.querySelector('.hero-approved');if(hero){
  hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;hero.style.setProperty('--hx',x.toFixed(3));hero.style.setProperty('--hy',y.toFixed(3));});
  hero.addEventListener('pointerleave',()=>{hero.style.setProperty('--hx','0');hero.style.setProperty('--hy','0')});
}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('reveal-in')}),{threshold:.12});
document.querySelectorAll('.section,.quicklinks,.join-banner,.card,.panel,.recruitment-board,.war-room').forEach(el=>{el.classList.add('reveal');io.observe(el)});
})();