// Existing published estimator prices; never used as an authoritative invoice.
export const KIT = [
 ['branding','Creator Logo / Brand Mark',149,'branding'],['scenes','Animated Scene Pack',299,'streamkit'],
 ['alerts','5 Cinematic Alerts',249,'streamkit'],['emotes10','10 Custom Emotes',179,'emotes'],
 ['music','Creator Theme Music',199,'audio'],['voice','Funny Voice Pack',129,'audio'],
 ['trailer','Stream Trailer',399,'cinematics'],['website','Creator Website',699,'site'],
 ['emotes6','6 Emotes',119,'emotes']
];
export function selectedKit(value){const ids=new Set(String(value||'').split(','));return KIT.filter(([id])=>ids.has(id));}
export function describeKit(value){const items=selectedKit(value);return items.length?items.map(([,name,price])=>name+' ($'+price+')').join(', ')+'\nStarting estimate: $'+items.reduce((sum,item)=>sum+item[2],0)+'. Final scope and price require studio approval.':'';}
