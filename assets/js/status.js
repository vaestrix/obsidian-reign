(()=> {
  const target=new Date("2026-09-30T08:00:00-05:00").getTime();
  let liveTriggered=false;

  function tick(){
    const el=document.querySelector("[data-countdown]");
    if(!el)return;

    const diff=target-Date.now();

    if(diff<=0){
      el.classList.add("is-live");
      el.innerHTML='<div class="servers-live"><span class="live-pulse"></span><strong>SERVERS ARE LIVE!</strong><small>ZIKEL • NA EAST • ASMODIAN</small></div>';
      if(!liveTriggered){
        liveTriggered=true;
        document.body.classList.add("servers-live-mode");
      }
      return;
    }

    const d=diff;
    const vals=[
      Math.floor(d/864e5),
      Math.floor(d%864e5/36e5),
      Math.floor(d%36e5/6e4),
      Math.floor(d%6e4/1e3)
    ];
    const labels=["DAYS","HOURS","MINUTES","SECONDS"];

    el.classList.remove("is-live");
    el.innerHTML=vals.map((v,i)=>`
      <span class="count-unit">
        <b>${String(v).padStart(2,"0")}</b>
        <small>${labels[i]}</small>
      </span>
    `).join("");
  }

  tick();
  setInterval(tick,1000);
})();