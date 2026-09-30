(()=> {
  const root=document.querySelector("[data-docgotgame-stopwatch]");
  if(!root)return;
  const parts=root.querySelectorAll("span b");
  const started=performance.now();
  function tick(now){
    const elapsed=Math.max(0,now-started);
    const totalMs=Math.floor(elapsed);
    const days=Math.floor(totalMs/86400000);
    const hours=Math.floor(totalMs%86400000/3600000);
    const mins=Math.floor(totalMs%3600000/60000);
    const secs=Math.floor(totalMs%60000/1000);
    const ms=totalMs%1000;
    const vals=[days,hours,mins,secs,ms];
    parts.forEach((el,i)=>el.textContent=String(vals[i]).padStart(i===4?3:2,"0"));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();