import { authenticate, receiveWebhook } from './savannah.js';
import legacyWorker from './legacy-worker.js';
import { portal } from './portal.js';
export { ProjectHub } from './portal.js';
export { CommandStore } from './legacy-worker.js';
export { SavannahInbox } from './savannah.js';
export default {
  async fetch(request, env) {
    const response = await portal(request, env);
    if (response) return response;
    if (new URL(request.url).pathname === '/webhooks/hostinger/anna') return receiveWebhook(request, { ...env,
      HOSTINGER_WEBHOOK_SECRET: env.ANNA_WEBHOOK_SECRET, HOSTINGER_MAILBOX_ID: env.ANNA_MAILBOX_ID,
      SAVANNAH_REGISTRY_ID: env.HOSTINGER_MAILBOX_ID, INBOUND_MAILBOX_ADDRESS: 'anna@obsidianreign.gg' });
    if (new URL(request.url).pathname === '/api/anna/prospects') {
      if (request.method !== 'POST') return Response.json({ error:'method-not-allowed' }, { status:405 });
      if (!await authenticate(request, env.ANNA_AGENT_TOKEN)) return Response.json({error:'unauthorized'},{status:401});
      let lead; try { const body = await request.text(); if(body.length>8192)throw Error(); lead=JSON.parse(body); } catch { return Response.json({error:'invalid-prospect'},{status:400}); }
      return env.SAVANNAH_INBOX.get(env.SAVANNAH_INBOX.idFromName(env.HOSTINGER_MAILBOX_ID)).fetch(new Request('https://internal/anna',{method:'POST',body:JSON.stringify({annaLead:lead})}));
    }
    if (new URL(request.url).pathname === '/webhooks/hostinger') return receiveWebhook(request, env);
    return legacyWorker.fetch(request, env);
  }
};

