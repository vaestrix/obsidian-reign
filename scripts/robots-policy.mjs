// Smoke-check the ASCII paths used by this site's production verification.
export function crawlerAllowed(robots, agent, path) {
  const groups=[]; let group={agents:[],rules:[]};
  for(const original of robots.split(/\r?\n/)) {
    const line=original.replace(/#.*/,'').trim(),index=line.indexOf(':');if(index<0)continue;
    const name=line.slice(0,index).trim().toLowerCase(),value=line.slice(index+1).trim();
    if(name==='user-agent') {
      if(group.rules.length){groups.push(group);group={agents:[],rules:[]};}
      group.agents.push(value.toLowerCase());
    } else if(['allow','disallow'].includes(name)&&group.agents.length)group.rules.push({allow:name==='allow',value});
  }
  groups.push(group);
  const matches=groups.map(group=>({...group,specificity:Math.max(-1,...group.agents.map(value=>value==='*'?0:agent.toLowerCase().includes(value)?value.length:-1))}));
  const best=Math.max(-1,...matches.map(group=>group.specificity));let longest=-1,allowed=true;
  for(const group of matches.filter(group=>group.specificity===best&&best>=0))for(const rule of group.rules){
    if(!rule.value)continue;
    const end=rule.value.endsWith('$'),value=end?rule.value.slice(0,-1):rule.value;
    const expression=value.split('*').map(part=>part.replace(/[.*+?^{}$()|[\]\\]/g,'\\$&')).join('.*');
    if(!new RegExp('^'+expression+(end?'$':'')).test(path))continue;
    const length=value.replaceAll('*','').length;
    if(length>longest){longest=length;allowed=rule.allow;}
    else if(length===longest&&rule.allow)allowed=true;
  }
  return allowed;
}
