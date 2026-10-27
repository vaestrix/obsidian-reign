document.addEventListener('play',event=>{if(event.target instanceof HTMLAudioElement)document.querySelectorAll('audio').forEach(audio=>{if(audio!==event.target)audio.pause();});},true);
