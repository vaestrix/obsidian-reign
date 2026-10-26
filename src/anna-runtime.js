import campaign from '../config/anna-campaign.json' with { type: 'json' };
import { automationWaiting } from './automation-window.js';
const validEmail = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
export async function contactKey(address) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(address.toLowerCase().trim()));
  return 'anna:contact:' + [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2,'0')).join('');
}
export function compliantOutreachText(text,address) {
  return typeof text==='string' && typeof address==='string' && address.trim().length>=20 && text.includes(address.trim()) && /\bAI (?:outreach )?assistant\b/i.test(text) && /commercial|advertisement/i.test(text) && /stop outreach|opt out|unsubscribe|no further contact/i.test(text) && !/\[ADD |\[VALID |ADDRESS REQUIRED|PLACEHOLDER/i.test(text);
}
export function outreachReady(env) {
  return env.STAGING!=='true' && env.ANNA_AUTO_SEND==='true' && env.ANNA_OUTREACH_VERIFIED==='true' && env.ANNA_POSTAL_ADDRESS_CONFIRMED==='true' && typeof env.ANNA_BUSINESS_ADDRESS==='string' && env.ANNA_BUSINESS_ADDRESS.trim().length>=20 && env.ANNA_BUSINESS_ADDRESS.length<=400 && !/required|placeholder|add verified|\[|\]/i.test(env.ANNA_BUSINESS_ADDRESS) && Boolean(env.ANNA_MAIL_API_TOKEN && env.ANNA_MAILBOX_ID) && campaign.approval?.approvedBy==='Philip';
}
export function outreachMessage(lead,env) {
  const to = lead.email?.trim().toLowerCase();
  const safe = (v,max) => typeof v === 'string' && v.trim() && v.length <= max && !/[\r\n]/.test(v);
  const https = v => { try { return new URL(v).protocol === 'https:'; } catch { return false; } };
  const age = Date.now() - Date.parse(lead.verifiedAt);
  if (!validEmail.test(to ?? '') || to.endsWith('@obsidianreign.gg') || !safe(lead.name,100) || !safe(lead.observation,400) ||
      !https(lead.channelUrl) || !https(lead.contactSourceUrl) || lead.publicBusinessContact !== true || lead.contactVerified !== true ||
      lead.outreachEligible !== true || lead.language !== 'English' || lead.segment !== 'smaller growing streamers' ||
      lead.suppressed || lead.alreadyContacted || lead.alreadyReplied || !Number.isFinite(age) || age < -60000 || age > 7*86400000 ||
      /https?:|\$|guarantee|discount|free trial|watched|six years|6 years|ignore.*instruction/i.test(lead.observation)) throw Error('ineligible-prospect');
  return { to: [to], displayName:'Anna | Obsidian Reign Studios', subject:'Creator design inquiry from Obsidian Reign Studios',
    text:`Hi ${lead.name},\n\nI'm Anna, Obsidian Reign Studios' AI outreach assistant. ${lead.observation.trim()}\n\nWe help creators with emotes, stream branding, and stream kits. If you're considering a refresh, Savannah can help you explore what fits your channel. You can reply here or email savannah@obsidianreign.gg.\n\nAnna | Obsidian Reign Studios\n${env.ANNA_BUSINESS_ADDRESS.trim()}\n\nThis is a commercial introduction. To opt out, reply “stop outreach” or email savannah@obsidianreign.gg with that request.` };
}
export async function queueProspect(ctx,env,lead) {
  if (automationWaiting(env)) return Response.json({error:'launch-not-started',startsAt:env.AGENTS_START_AT},{status:503});
  if (!outreachReady(env)) return Response.json({error:'anna-not-enabled'},{status:503});
  if (env.SAVANNAH_AUTO_SEND !== 'true') return Response.json({error:'savannah-handoff-paused'},{status:503});
  let message; try { message = outreachMessage(lead,env); } catch { return Response.json({error:'ineligible-prospect'},{status:400}); }
  if (lead.approvedDraft) {
    const draft = lead.approvedDraft;
    if (typeof draft.subject !== 'string' || /[\r\n]/.test(draft.subject) || draft.subject.length > 200 ||
        typeof draft.text !== 'string' || draft.text.length > 6500) return Response.json({error:'invalid-approved-draft'},{status:400});
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message.to[0]+'\n'+draft.subject+'\n'+draft.text));
    const hash = [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
    let approved; try { approved=JSON.parse(env.ANNA_APPROVED_DRAFT_HASHES ?? '[]'); } catch { approved=[]; }
    if (!Array.isArray(approved) || !approved.includes(hash)) return Response.json({error:'draft-not-approved'},{status:403});
    message={...message,subject:draft.subject,text:draft.text};
  }
  if(!compliantOutreachText(message.text,env.ANNA_BUSINESS_ADDRESS))return Response.json({error:'draft-compliance-missing'},{status:403});
  const key = await contactKey(message.to[0]);
  return ctx.blockConcurrencyWhile(async () => {
    if(await ctx.storage.get(key))return Response.json({error:'already-contacted-or-suppressed'},{status:409});
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const quotaKey='anna:quota:'+day; const used=Math.max(await ctx.storage.get(quotaKey)??0,await ctx.storage.get('anna:attempts:'+day)??0);
    if(used>=Math.min(5,campaign.dailyLimit))return Response.json({error:'daily-limit'},{status:429});
    await ctx.storage.transaction(async tx=>{
      await tx.put(quotaKey,used+1);
      await tx.put(key,{state:'queued',createdAt:Date.now(),evidence:{channelUrl:lead.channelUrl,contactSourceUrl:lead.contactSourceUrl,verifiedAt:lead.verifiedAt}});
      await tx.put('anna:outbox:'+key,{key,message,state:'queued'});
      if(!await tx.getAlarm())await tx.setAlarm(Date.now()+1000);
    });
    return Response.json({accepted:true},{status:202});
  });
}
export async function dispatchProspects(ctx,env) {
  if (automationWaiting(env)) return;
  if(!outreachReady(env) || env.SAVANNAH_AUTO_SEND !== 'true')return;
  for(const [jobKey,job] of await ctx.storage.list({prefix:'anna:outbox:'})) {
    if(job.state!=='queued')continue;
    // Recheck the configured postal identity for queued work before any send attempt.
    if(!compliantOutreachText(job.message?.text,env.ANNA_BUSINESS_ADDRESS)){await ctx.storage.put(jobKey,{...job,state:'held-compliance'});continue;}
    const contact=await ctx.storage.get(job.key);
    if(contact?.state!=='queued'){await ctx.storage.put(jobKey,{...job,state:'cancelled'});continue;}
    if(Date.now()-Date.parse(contact.evidence?.verifiedAt)>7*86400000){await ctx.storage.put(jobKey,{key:job.key,state:'stale-verification'});continue;}
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const reserved=await ctx.storage.transaction(async tx=>{
      const current=await tx.get(job.key); const count=await tx.get('anna:attempts:'+day)??0;
      if(current?.state!=='queued'||count>=Math.min(5,campaign.dailyLimit))return false;
      await tx.put('anna:attempts:'+day,count+1);
      await tx.put(job.key,{...current,state:'send-attempted'});
      await tx.put(jobKey,{...job,state:'send-attempted'});
      return true;
    });
    if(!reserved){await ctx.storage.setAlarm(Date.now()+3600000);continue;}
    let state='send-outcome-unknown';
    try {
      const r=await fetch('https://api.mail.hostinger.com/api/v1/mailboxes/'+encodeURIComponent(env.ANNA_MAILBOX_ID)+'/send',{
        method:'POST',redirect:'manual',signal:AbortSignal.timeout(20000),headers:{Authorization:'Bearer '+env.ANNA_MAIL_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(job.message)});
      if(r.ok)state='sent';
    } catch {}
    const latest=await ctx.storage.get(job.key);
    await ctx.storage.put(job.key,{...latest,state:['suppressed','replied'].includes(latest?.state)?latest.state:state,sendState:state,updatedAt:Date.now()});
    await ctx.storage.put(jobKey,{key:job.key,state,at:Date.now()});
    console.log(JSON.stringify({event:'anna-outreach',state}));
  }
}
