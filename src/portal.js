import legacyWorker from './legacy-worker.js';

const DAY = 86400000;
const SESSION = '__Host-or_client';
const STATE = '__Host-or_oauth';
export const STAGES = ['Brief received', 'Design direction', 'In production', 'Ready for review', 'Delivered'];
export const QUOTE_STATUSES = ['Not quoted', 'Draft', 'Sent', 'Accepted', 'Declined'];
const providers = {
  google: { label: 'Google', auth: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token', profile: 'https://openidconnect.googleapis.com/v1/userinfo', scope: 'openid profile email', pkce: true },
  twitch: { label: 'Twitch', auth: 'https://id.twitch.tv/oauth2/authorize', token: 'https://id.twitch.tv/oauth2/token', profile: 'https://api.twitch.tv/helix/users', scope: '' },
  kick: { label: 'Kick', auth: 'https://id.kick.com/oauth/authorize', token: 'https://id.kick.com/oauth/token', profile: 'https://api.kick.com/public/v1/users', scope: 'user:read', pkce: true }
};
export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } });
const random = () => [...crypto.getRandomValues(new Uint8Array(32))].map(x => x.toString(16).padStart(2, '0')).join('');
export async function hash(value) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(x => x.toString(16).padStart(2, '0')).join(''); }
const cookie = (name, value, age) => `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${age}`;
const readCookie = (request, name) => (request.headers.get('Cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith(name + '='))?.slice(name.length + 1) || '';
const text = (v, max = 2000) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const enabled = (env, p) => Boolean(env[p.toUpperCase() + '_CLIENT_ID'] && env[p.toUpperCase() + '_CLIENT_SECRET']);
const redirect = (path, cookies = []) => { const headers = new Headers({ Location: path, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }); cookies.forEach(c => headers.append('Set-Cookie', c)); return new Response(null, { status: 303, headers }); };
function hub(env) { return env.PROJECT_HUB.get(env.PROJECT_HUB.idFromName('studio-projects')); }
async function call(env, operation, data = {}) { const r = await hub(env).fetch(new Request('https://hub/' + operation, { method: 'POST', body: JSON.stringify(data) })); return r.json(); }
async function session(request, env) { const token = readCookie(request, SESSION); return token ? call(env, 'session', { key: await hash(token) }) : null; }
async function login(env, user) { const token = random(); await call(env, 'login', { key: await hash(token), user }); return token; }
async function body(request) { if (Number(request.headers.get('Content-Length')) > 16000) throw new Error('Request too large'); const raw = await request.text(); if (raw.length > 16000) throw new Error('Request too large'); return JSON.parse(raw); }
export function validateProject(input) {
  const title = text(input.title, 120), owner = text(input.owner, 120);
  if (!title || !/^(google|twitch|kick|invite):[a-zA-Z0-9_-]+$/.test(owner)) throw new Error('A title and valid client account ID are required.');
  const stage = Number(input.stage);
  if (!Number.isInteger(stage) || stage < 0 || stage >= STAGES.length) throw new Error('Choose a valid project stage.');
  const due = text(input.due, 10);
  if (due && (!/^\d{4}-\d{2}-\d{2}$/.test(due) || Number.isNaN(Date.parse(due)))) throw new Error('Use a valid target date.');
  const fileUrl = text(input.fileUrl, 1500);
  if (fileUrl) { const u = new URL(fileUrl); if (u.protocol !== 'https:' || u.username || u.password) throw new Error('Use an HTTPS review or delivery link.'); }
  const quoteAmount = text(input.quoteAmount, 20);
  if (quoteAmount && (!/^\d{1,7}(\.\d{1,2})?$/.test(quoteAmount) || Number(quoteAmount) > 1000000)) throw new Error('Enter a valid USD quote amount.');
  const quoteStatus = text(input.quoteStatus, 30) || 'Not quoted';
  if (!QUOTE_STATUSES.includes(quoteStatus)) throw new Error('Choose a valid quote status.');
  const followupDate = text(input.followupDate, 10);
  if (followupDate && (!/^\d{4}-\d{2}-\d{2}$/.test(followupDate) || Number.isNaN(Date.parse(followupDate)))) throw new Error('Use a valid follow-up date.');
  const nextUpdateDate = text(input.nextUpdateDate, 10);
  if (nextUpdateDate && (!/^\d{4}-\d{2}-\d{2}$/.test(nextUpdateDate) || Number.isNaN(Date.parse(nextUpdateDate)))) throw new Error('Use a valid next update date.');
  const counts = {};
  for (const key of ['revisionsIncluded', 'revisionsUsed']) {
    const value = input[key];
    if (value === '' || value === undefined || value === null) counts[key] = null;
    else { if (!/^\d{1,2}$/.test(String(value))) throw new Error('Revision counts must be whole numbers from 0 to 99.'); counts[key] = Number(value); }
  }
  return { title, owner, stage, due, summary: text(input.summary), nextStep: text(input.nextStep, 500), fileUrl, quoteAmount, quoteStatus, followupDate, followupNote: text(input.followupNote, 1000), internalNotes: text(input.internalNotes, 3000), nextUpdateDate, ...counts };
}

async function agentAuthorized(request, env) {
  const expected = env.PORTAL_AGENT_TOKEN;
  const supplied = (request.headers.get('Authorization') || '').replace(/^Bearer /, '');
  if (!expected || expected.length < 32 || supplied.length > 256) return false;
  const a = await hash(expected), b = await hash(supplied); let diff = 0;
  for (let i=0;i<a.length;i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const clientProject = p => Object.fromEntries(['id','title','stage','due','summary','nextStep','fileUrl','timeline','createdAt','updatedAt','nextUpdateDate','revisionsIncluded','revisionsUsed','reviews'].map(k=>[k,p[k]]));

export async function portal(request, env) {
  const url = new URL(request.url), path = decodeURIComponent(url.pathname);
  if (!(path.startsWith('/api/portal/') || path.startsWith('/auth/client/') || path.startsWith('/auth/admin/') || path === '/admin/projects' || path === '/project-admin.html' || path === '/project-admin')) return null;
  if (!env.PROJECT_HUB) return json({ error: 'Project access is temporarily unavailable.' }, 503);
  const origin = env.PUBLIC_ORIGIN || url.origin;
  const isAgent = path.startsWith('/api/portal/agent/');
  if (request.method === 'POST' && !isAgent && request.headers.get('Origin') !== origin) return json({ error: 'Please submit this request from the studio website.' }, 403);
  try {
    if (isAgent) {
      if (!await agentAuthorized(request, env)) return json({ error: 'Agent authentication required.' }, 401);
      if(path === '/api/portal/agent/projects' && request.method === 'GET') return json(await call(env, 'all'));
      if(path === '/api/portal/agent/followup' && request.method === 'POST') {
        const data = await body(request);
        const date = text(data.followupDate,10), note = text(data.followupNote,1000);
        if(!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || !note) return json({error:'A follow-up date and action note are required.'},400);
        const result = await call(env,'followup',{id:text(data.id,80),followupDate:date,followupNote:note});
        return json(result,result.error?404:200);
      }
      return json({error:'Agents can review projects and schedule follow-ups only.'},403);
    }
    if (path === '/auth/admin/login' && request.method === 'POST') {
      const rate = await call(env, 'rate', { key: 'admin:' + await hash(request.headers.get('CF-Connecting-IP') || 'unknown') });
      if (!rate.allowed) return json({ error: 'Too many attempts. Please wait a minute.' }, 429);
      const data = await body(request);
      const headers = new Headers(); headers.set('Authorization', 'Basic ' + btoa('admin:' + String(data.password || '')));
      const check = await legacyWorker.fetch(new Request(origin + '/api/admin/state', { headers }), env);
      if (!check.ok) return json({ error: 'That admin password was not accepted.' }, 401);
      const token = random(); await call(env, 'login', { key: await hash(token), user: { id: 'studio:admin', authVersion: env.ADMIN_PASSWORD_SHA256 }, duration: 3600000 });
      const response = json({ ok: true }); response.headers.append('Set-Cookie', cookie('__Host-or_admin', token, 3600)); return response;
    }
    if (path === '/auth/admin/logout' && request.method === 'POST') {
      await call(env, 'logout', { key: await hash(readCookie(request, '__Host-or_admin')) });
      const response = json({ ok: true }); response.headers.append('Set-Cookie', cookie('__Host-or_admin', '', 0)); return response;
    }
    if (path === '/api/portal/providers' && request.method === 'GET') return json({ providers: Object.entries(providers).map(([id, p]) => ({ id, label: p.label, enabled: enabled(env, id) })) });
    if (path.startsWith('/admin/') || path.startsWith('/project-admin') || path.startsWith('/api/portal/admin/')) {
      const check = await legacyWorker.fetch(new Request(origin + '/api/admin/state', { headers: request.headers }), env);
      const token = readCookie(request, '__Host-or_admin');
      const admin = token ? await call(env, 'session', { key: await hash(token) }) : null;
      const validSession = admin?.id === 'studio:admin' && admin.authVersion && admin.authVersion === env.ADMIN_PASSWORD_SHA256;
      if (!check.ok && !validSession) return path.startsWith('/api/') ? json({ error: 'Admin sign-in required.' }, 401) : redirect('/admin-login.html');
      if (path === '/admin/projects' || path === '/project-admin.html' || path === '/project-admin') {
        const response = await env.ASSETS.fetch(new Request(origin + '/project-admin', request));
        const headers = new Headers(response.headers); headers.set('Cache-Control', 'no-store'); headers.set('X-Robots-Tag', 'noindex'); return new Response(response.body, { status: response.status, headers });
      }
      if (path === '/api/portal/admin/projects' && request.method === 'GET') return json(await call(env, 'all'));
      if (path === '/api/portal/admin/projects' && request.method === 'POST') {
        const data = await body(request); validateProject(data); const result = await call(env, 'save', { ...data, id: text(data.id, 80), update: text(data.update), reviewLabel: text(data.reviewLabel, 120), reviewUrl: text(data.reviewUrl, 1500) }); return json(result, result.error ? 400 : 200);
      }
      if (path === '/api/portal/admin/invite' && request.method === 'POST') {
        const data = await body(request), id = text(data.id, 80);
        const code = random(); const result = await call(env, 'invite', { id, key: await hash(code) });
        return result.error ? json(result, 400) : json({ code, expiresAt: result.expiresAt });
      }
      return json({ error: 'Unknown operation.' }, 404);
    }
    if (path === '/auth/client/invite' && request.method === 'POST') {
      const rate = await call(env, 'rate', { key: await hash(request.headers.get('CF-Connecting-IP') || 'unknown') });
      if (!rate.allowed) return json({ error: 'Too many attempts. Please wait a minute.' }, 429);
      const { code } = await body(request);
      if (!/^[a-f0-9]{64}$/.test(text(code, 100))) return json({ error: 'That access code is invalid or expired.' }, 400);
      const user = await call(env, 'redeem', { key: await hash(code.trim()) });
      if (!user?.id) return json({ error: 'That access code is invalid or expired. Ask Savannah for a new code.' }, 400);
      const token = await login(env, user); const response = json({ ok: true }); response.headers.append('Set-Cookie', cookie(SESSION, token, 604800)); return response;
    }
    if (path === '/auth/client/logout' && request.method === 'POST') { await call(env, 'logout', { key: await hash(readCookie(request, SESSION)) }); const r = json({ ok: true }); r.headers.append('Set-Cookie', cookie(SESSION, '', 0)); return r; }
    const match = path.match(/^\/auth\/client\/(google|twitch|kick)(\/callback)?$/);
    if (match && request.method === 'GET') {
      const [, id, callback] = match, config = providers[id];
      if (!enabled(env, id)) return redirect('/client-portal?notice=provider');
      const callbackUrl = origin + '/auth/client/' + id + '/callback';
      if (!callback) {
        const rate = await call(env, 'rate', { key: await hash(request.headers.get('CF-Connecting-IP') || 'unknown') });
        if (!rate.allowed) return json({ error: 'Please wait a minute before trying again.' }, 429);
        const state = random(), verifier = random();
        await call(env, 'oauth-save', { key: await hash(state), provider: id, verifier });
        const auth = new URL(config.auth);
        for (const [k, v] of Object.entries({ client_id: env[id.toUpperCase() + '_CLIENT_ID'], redirect_uri: callbackUrl, response_type: 'code', scope: config.scope, state })) auth.searchParams.set(k, v);
        if (config.pkce) { const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))); auth.searchParams.set('code_challenge', btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')); auth.searchParams.set('code_challenge_method', 'S256'); }
        return redirect(auth.toString(), [cookie(STATE, state, 600)]);
      }
      const state = url.searchParams.get('state') || '';
      if (!state || state !== readCookie(request, STATE)) return redirect('/client-portal?notice=login');
      const pending = await call(env, 'oauth-take', { key: await hash(state) });
      if (!pending || pending.provider !== id || !url.searchParams.get('code')) return redirect('/client-portal?notice=login', [cookie(STATE, '', 0)]);
      const form = new URLSearchParams({ client_id: env[id.toUpperCase() + '_CLIENT_ID'], client_secret: env[id.toUpperCase() + '_CLIENT_SECRET'], code: url.searchParams.get('code'), grant_type: 'authorization_code', redirect_uri: callbackUrl });
      if (config.pkce) form.set('code_verifier', pending.verifier);
      const tokenRes = await fetch(config.token, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form, signal: AbortSignal.timeout(10000) });
      if (!tokenRes.ok) throw new Error('Login failed');
      const token = await tokenRes.json(); if (!token.access_token) throw new Error('Login failed');
      const headers = { Authorization: 'Bearer ' + token.access_token }; if (id === 'twitch') headers['Client-Id'] = env.TWITCH_CLIENT_ID;
      const profileRes = await fetch(config.profile, { headers, signal: AbortSignal.timeout(10000) }); if (!profileRes.ok) throw new Error('Login failed');
      const profile = await profileRes.json(), user = id === 'google' ? profile : profile.data?.[0];
      const externalId = id === 'google' ? user?.sub : id === 'kick' ? user?.user_id : user?.id;
      if (!externalId || !/^[a-zA-Z0-9_-]+$/.test(String(externalId))) throw new Error('Login failed');
      const clientToken = await login(env, { id: id + ':' + externalId, name: text(user.name || user.display_name || user.login || 'Creator', 100), provider: id });
      return redirect('/client-portal', [cookie(SESSION, clientToken, 604800), cookie(STATE, '', 0)]);
    }
    if (path === '/api/portal/me' && request.method === 'GET') { const user = await session(request, env); return json({ user }); }
    const user = await session(request, env);
    if (!user) return json({ error: 'Sign in to view your projects.' }, 401);
    if (path === '/api/portal/projects' && request.method === 'GET') { const data = await call(env, 'projects', { owner: user.id }); return json({projects:data.projects.map(clientProject)}); }
    if (path === '/api/portal/review' && request.method === 'POST') {
      const data = await body(request), action = data.action, message = text(data.message);
      if (!['approved', 'changes-requested'].includes(action) || (action === 'changes-requested' && !message)) return json({error:'Choose approval or describe the changes you need.'},400);
      const result = await call(env,'review',{id:text(data.id,80),versionId:text(data.versionId,80),owner:user.id,action,message});
      return json(result,result.error ? 409 : 200);
    }
    if (path === '/api/portal/feedback' && request.method === 'POST') {
      const data = await body(request), message = text(data.message);
      if (!message) return json({ error: 'Write a message first.' }, 400);
      const result = await call(env, 'feedback', { id: text(data.id, 80), owner: user.id, message }); return json(result, result.error ? 404 : 200);
    }
    return json({ error: 'Unknown operation.' }, 404);
  } catch { if(path.startsWith('/auth/client/') && request.method === 'GET') return redirect('/client-portal?notice=login', [cookie(STATE, '', 0)]); return json({ error: 'We could not complete that request. Please try again or contact Savannah.' }, 400); }
}

export class ProjectHub {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(request) {
    const operation = new URL(request.url).pathname.slice(1), data = await request.json(), now = Date.now();
    const result = await this.ctx.storage.transaction(async store => {
      if (operation === 'login') { await store.put('session:' + data.key, { user: data.user, expiresAt: now + (data.duration === 3600000 ? 3600000 : 7 * DAY) }); return { ok: true }; }
      if (operation === 'session') { const s = await store.get('session:' + data.key); return s && s.expiresAt > now ? s.user : null; }
      if (operation === 'logout') { await store.delete('session:' + data.key); return { ok: true }; }
      if (operation === 'rate') { const key = 'rate:' + data.key; let rate = await store.get(key); if (!rate || rate.expiresAt <= now) rate = { count: 0, expiresAt: now + 60000 }; rate.count++; await store.put(key, rate); return { allowed: rate.count <= 10 }; }
      if (operation === 'oauth-save') { await store.put('oauth:' + data.key, { provider: data.provider, verifier: data.verifier, expiresAt: now + 600000 }); return { ok: true }; }
      if (operation === 'oauth-take' || operation === 'redeem') { const key = (operation === 'redeem' ? 'invite:' : 'oauth:') + data.key; const v = await store.get(key); await store.delete(key); return v && v.expiresAt > now ? operation === 'redeem' ? v.user : v : null; }
      if (operation === 'all' || operation === 'projects') { const values = [...(await store.list({ prefix: 'project:' })).values()]; return { projects: values.filter(p => operation === 'all' || p.owner === data.owner).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) }; }
      if (operation === 'save') {
        const id = data.id || crypto.randomUUID(); if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) return { error: 'Invalid project ID.' };
        const old = await store.get('project:' + id); if (data.id && !old) return { error: 'Project not found.' };
        const project = { ...validateProject({...old,...data}), id, updatedAt: new Date(now).toISOString(), createdAt: old?.createdAt || new Date(now).toISOString(), timeline: old?.timeline || [], activity: old?.activity || [], reviews: old?.reviews || [] };
        if (data.reviewLabel || data.reviewUrl) {
          if (!data.reviewLabel || !data.reviewUrl) return {error:'Add both a preview label and an HTTPS preview link.'};
          let u; try { u = new URL(data.reviewUrl); } catch { return {error:'Use a valid HTTPS preview link.'}; }
          if(u.protocol !== 'https:' || u.username || u.password) return {error:'Use a valid HTTPS preview link.'};
          if(project.reviews.length >= 30) return {error:'This project has reached its 30-version limit.'};
          project.reviews = [{id:crypto.randomUUID(),number:project.reviews.length+1,label:text(data.reviewLabel,120),url:u.href,status:'pending',createdAt:project.updatedAt},...project.reviews];
          project.timeline = [{author:'Studio',message:'Preview v'+project.reviews[0].number+' ready: '+project.reviews[0].label,at:project.updatedAt},...project.timeline].slice(0,50);
        }
        project.activity = [{author:'Studio admin',message:'Project details saved',at:project.updatedAt},...project.activity].slice(0,50);
        if (data.update || !old || old.stage !== project.stage) project.timeline = [{ author: 'Studio', message: text(data.update) || STAGES[project.stage], at: project.updatedAt }, ...project.timeline].slice(0, 50);
        await store.put('project:' + id, project); return { project };
      }
      if (operation === 'feedback') { const p = await store.get('project:' + data.id); if (!p || p.owner !== data.owner) return { error: 'Project not found.' }; if (p.timeline[0]?.author === 'Client' && now - Date.parse(p.timeline[0].at) < 10000) return { error: 'Please wait a moment before posting again.' }; p.timeline = [{ author: 'Client', message: text(data.message), at: new Date(now).toISOString() }, ...p.timeline].slice(0, 50); p.updatedAt = new Date(now).toISOString(); await store.put('project:' + p.id, p); return { ok: true }; }
      if (operation === 'review') {
        const p=await store.get('project:'+data.id), v=p?.reviews?.[0];
        if(!p || p.owner!==data.owner || !v || v.id!==data.versionId) return {error:'This preview is no longer current. Refresh your project.'};
        if(v.status!=='pending') return {error:'A decision has already been recorded for this version.'};
        if(!['approved','changes-requested'].includes(data.action) || (data.action==='changes-requested' && !text(data.message))) return {error:'Describe the requested changes.'};
        v.status=data.action;v.message=text(data.message);v.decidedAt=new Date(now).toISOString();
        p.updatedAt=v.decidedAt;p.timeline=[{author:'Client',message:'Preview v'+v.number+' '+(v.status==='approved'?'approved':'changes requested')+(v.message?': '+v.message:''),at:v.decidedAt},...p.timeline].slice(0,50);
        p.activity=[{author:'Client',message:'Decision recorded for preview v'+v.number,at:v.decidedAt},...(p.activity||[])].slice(0,50);
        await store.put('project:'+p.id,p);return {ok:true};
      }
      if(operation === 'followup') { const p = await store.get('project:'+data.id); if(!p) return {error:'Project not found.'}; p.followupDate=data.followupDate;p.followupNote=data.followupNote;p.updatedAt=new Date(now).toISOString();p.activity=[{author:'Project agent',message:'Follow-up scheduled for '+data.followupDate+': '+data.followupNote,at:p.updatedAt},...(p.activity||[])].slice(0,50);await store.put('project:'+p.id,p);return {ok:true,projectId:p.id,followupDate:p.followupDate}; }
      if (operation === 'invite') { const p = await store.get('project:' + data.id); if (!p || !p.owner.startsWith('invite:')) return { error: 'Access codes are available for invited client accounts only.' }; const expiresAt = now + 7 * DAY; const previous = await store.get('active-invite:' + p.owner); if (previous) await store.delete('invite:' + previous); await store.put('invite:' + data.key, { user: { id: p.owner, name: 'Client', provider: 'invite' }, expiresAt }); await store.put('active-invite:' + p.owner, data.key); return { expiresAt }; }
      return { error: 'Unknown operation.' };
    });
    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(now + DAY);
    return json(result);
  }
  async alarm() { for (const prefix of ['session:', 'oauth:', 'invite:', 'rate:']) { const rows = await this.ctx.storage.list({ prefix }); for (const [key, value] of rows) if (value.expiresAt <= Date.now()) await this.ctx.storage.delete(key); } await this.ctx.storage.setAlarm(Date.now() + DAY); }
}
