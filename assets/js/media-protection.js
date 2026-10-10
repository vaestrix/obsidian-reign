(()=>{
 'use strict';
 // Casual-copy deterrents for public studio media; client deliverables keep their download links.
 const publicMedia=e=>e instanceof Element&&e.closest('img,video,picture');
 document.addEventListener('contextmenu',e=>{if(publicMedia(e.target))e.preventDefault();});
 document.addEventListener('dragstart',e=>{if(publicMedia(e.target))e.preventDefault();});
 function protect(root){const items=[];if(root instanceof Element&&root.matches('img,video'))items.push(root);if(root.querySelectorAll)items.push(...root.querySelectorAll('img,video'));for(const media of items){media.draggable=false;media.style.userSelect='none';media.style.webkitUserSelect='none';if(media.tagName==='VIDEO'){media.setAttribute('controlsList','nodownload noremoteplayback');media.disablePictureInPicture=true;media.disableRemotePlayback=true;}}}
 protect(document);new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(protect))).observe(document.documentElement,{childList:true,subtree:true});
})();
