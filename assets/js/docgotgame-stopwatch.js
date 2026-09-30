(()=> {
  const section=document.querySelector(".docgotgame-stopwatch");
  const root=document.querySelector("[data-docgotgame-stopwatch]");
  if(!section||!root)return;

  const parts=root.querySelectorAll("span b");
  const startAt=new Date("2026-09-30T08:00:00-05:00").getTime();

  function render(ms){
    const totalMs=Math.max(0,Math.floor(ms));
    const days=Math.floor(totalMs/86400000);
    const hours=Math.floor(totalMs%86400000/3600000);
    const mins=Math.floor(totalMs%3600000/60000);
    const secs=Math.floor(totalMs%60000/1000);
    const millis=totalMs%1000;
    const vals=[days,hours,mins,secs,millis];
    parts.forEach((el,i)=>el.textContent=String(vals[i]).padStart(i===4?3:2,"0"));
  }

  function tick(){
    const now=Date.now();

    if(now<startAt){
      section.classList.add("is-hidden-until-start");
      render(0);
      requestAnimationFrame(tick);
      return;
    }

    section.classList.remove("is-hidden-until-start");
    render(now-startAt);
    requestAnimationFrame(tick);
  }

  render(0);
  tick();
})();