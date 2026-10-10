import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
import { NAME, PERSONA, SavannahInbox, authenticate, normalizeEvent, preflight } from '../src/savannah.js';

const secret = 's'.repeat(48);
const event = { event: 'message.received', mailbox: { id: 'mailbox' }, message: { uid: 12, path: 'INBOX' } };
const message = { uid: 12, path: 'INBOX', date: '2026-10-09T12:00:00Z', flags: [], messageId: '<in@example.com>',
  from: { address: 'customer@example.com' }, to: [{ address: 'savannah@obsidianreign.gg' }], cc: [], attachments: [],
  subject: 'Website inquiry', text: 'Can you help with a website?', headers: { 'authentication-results': 'mx; dmarc=pass' } };
const makeRequest = (body = event, token = secret, method = 'POST') => new Request('https://example.com/webhooks/hostinger', {
  method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
  ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}) });

class Storage {
  data = new Map(); time = null;
  async get(k) { return structuredClone(this.data.get(k)); }
  async put(k, v) { this.data.set(k, structuredClone(v)); }
  async list({ prefix }) { return new Map([...this.data].filter(([k]) => k.startsWith(prefix)).map(([k,v]) => [k, structuredClone(v)])); }
  async setAlarm(time) { this.time = time; }
  async getAlarm() { return this.time; }
  async transaction(fn) { return fn(this); }
}
function setup(overrides = {}) {
  const storage = new Storage();
  const env = { HOSTINGER_MAILBOX_ID: 'mailbox', HOSTINGER_MAIL_API_TOKEN: 'test-only',
    PHILIP_ESCALATION_EMAIL: 'philip@example.com', SAVANNAH_APPROVED_FACTS: 'We provide website design.', SAVANNAH_AUTO_SEND: 'true',
    AI: { run: async () => ({ response: JSON.stringify({ action: 'reply', routine: true, uncertain: false, confidence: 0.99, reply: 'Hi! Happy to help. What kind of website do you have in mind?' }) }) }, ...overrides };
  const object = new SavannahInbox({ storage, blockConcurrencyWhile: fn => fn() }, env);
  return { storage, env, object };
}
function mockMail(t, options = {}) {
  const sends = []; const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/send')) {
      const body = JSON.parse(init.body); sends.push(body);
      if (options.timeout && body.to[0] === 'customer@example.com') throw new Error('timeout');
      if (options.emptySend) return new Response(null, { status: 204 });
      return Response.json({ data: { messageId: '<sent@example.com>' } });
    }
    if (options.readFailure) return new Response('', { status: 503 });
    if (options.redirectRead) return new Response('', { status: 302, headers: { location: 'https://attacker.example/' } });
    if (url.includes('/search')) {
      const query = JSON.parse(init.body);
      if (options.resolveFolder && query.header === `Message-ID:${message.messageId}` && url.includes(`/folders/${encodeURIComponent(options.resolveFolder)}/`))
        return Response.json({ data: [{ ...message, path: options.resolveFolder }], pagination: { totalPages: 1 } });
      return Response.json({ data: options.alreadyAnswered ? [{ inReplyTo: message.messageId }] : [], pagination: { totalPages: 1 } });
    }
    if (url.endsWith('/source')) return new Response('Authentication-Results: mx; dmarc=pass\r\n\r\nbody');
    if (url.endsWith('/text')) return Response.json({ data: { text: options.text ?? message.text } });
    return Response.json({ data: { ...message, headers: undefined, text: undefined, ...(options.message ?? {}) } });
  };
  t.after(() => { globalThis.fetch = original; });
  return { sends, calls };
}
async function enqueue(object) { return object.fetch(new Request('https://internal', { method: 'POST', body: JSON.stringify({ uid: 12, folder: 'INBOX' }) })); }

test('successful empty send responses finish replies and escalations without repeat sends', async t => {
  const { sends } = mockMail(t, { emptySend: true });
  const reply = setup(); await enqueue(reply.object); await reply.object.alarm(); await reply.object.alarm();
  assert.equal((await reply.storage.get('job:INBOX:12')).state, 'replied');
  const review = setup({ SAVANNAH_AUTO_SEND: 'false' }); await enqueue(review.object); await review.object.alarm(); await review.object.alarm();
  assert.equal((await review.storage.get('job:INBOX:12')).state, 'escalated');
  assert.equal(sends.length, 2);
});

test('Mail API redirects are held without forwarding credentials to the redirect target', async t => {
  const { object, storage } = setup(); const { calls, sends } = mockMail(t, { redirectRead: true });
  await enqueue(object);
  for (let i = 0; i < 6; i++) await object.alarm();
  assert.equal((await storage.get('job:INBOX:12')).state, 'escalated');
  assert.equal(sends.length, 1); assert.equal(sends[0].to[0], 'philip@example.com');
  assert.ok(calls.every(c => c.init.redirect === 'manual' && c.url.startsWith('https://api.mail.hostinger.com/')));
});

test('Workers AI structured response receives the same conservative reply checks', async t => {
  const { object } = setup({ AI: { run: async () => ({ response: { action: 'reply', routine: true, uncertain: false, confidence: 0.99, reply: 'Hi! What kind of creator website do you have in mind?' } }) } });
  const { sends } = mockMail(t); await enqueue(object); await object.alarm();
  assert.equal(sends.length, 1); assert.equal(sends[0].to[0], 'customer@example.com');
  assert.equal(sends[0].displayName, NAME);
});

test('static requests retain asset behavior; webhook never falls back to assets', async () => {
  let count = 0; const env = { ASSETS: { fetch: () => { count++; return new Response('site'); } } };
  assert.equal(await (await worker.fetch(new Request('https://example.com/pricing'), env)).text(), 'site');
  assert.equal((await worker.fetch(makeRequest(), env)).status, 503);
  assert.equal(count, 1);
});
test('Bearer authentication rejects absent, wrong, oversized and short secrets', async () => {
  assert.equal(await authenticate(makeRequest(), secret), true);
  assert.equal(await authenticate(makeRequest(event, 'wrong'), secret), false);
  assert.equal(await authenticate(makeRequest(event, 's'.repeat(600)), secret), false);
  assert.equal(await authenticate(makeRequest(), 'short'), false);
});
test('authenticated webhook checks mailbox, UID, event, JSON and size', async () => {
  const env = { HOSTINGER_WEBHOOK_SECRET: secret, HOSTINGER_MAILBOX_ID: 'mailbox', SAVANNAH_INBOX: {
    idFromName: x => x, get: () => ({ fetch: () => new Response('', { status: 202 }) }) } };
  assert.equal((await worker.fetch(makeRequest(), env)).status, 202);
  assert.equal((await worker.fetch(makeRequest(event, 'wrong'), env)).status, 401);
  assert.equal((await worker.fetch(makeRequest('{'), env)).status, 400);
  assert.equal((await worker.fetch(makeRequest(' '.repeat(17000)), env)).status, 400);
  assert.equal((await worker.fetch(makeRequest(event, secret, 'GET'), env)).status, 405);
  assert.throws(() => normalizeEvent({ ...event, mailbox: 'other' }, 'mailbox'));
  assert.throws(() => normalizeEvent({ ...event, message: { uid: 0, path: 'INBOX' } }, 'mailbox'));
  assert.equal(normalizeEvent({ event: 'message.sent' }, 'mailbox'), null);
});
test('observed Hostinger payload uses mailboxAddress and Message-ID; bodyUrl is ignored', () => {
  const payload = { event: 'message.received', data: { mailboxAddress: 'savannah@obsidianreign.gg', messageId: '<in@example.com>',
    plainBody: 'Untrusted preview', bodyUrl: 'https://attacker.example/' } };
  assert.deepEqual(normalizeEvent(payload, 'mailbox'), { messageId: '<in@example.com>' });
  assert.throws(() => normalizeEvent({ ...payload, data: { ...payload.data, mailboxAddress: 'other@example.com' } }, 'mailbox'));
  assert.throws(() => normalizeEvent({ ...payload, data: { ...payload.data, messageId: 'id\r\nInjected: value' } }, 'mailbox'));
});
test('spam, lists, automated mail and self messages ignored', () => {
  for (const patch of [{ path: 'INBOX.Junk' }, { from: { address: 'savannah@obsidianreign.gg' } },
    { headers: { 'list-unsubscribe': '<https://example.com>' } }, { headers: { 'auto-submitted': 'auto-replied' } },
    { headers: { 'x-spam-flag': 'YES' } }, { flags: ['\\Answered'] }]) assert.equal(preflight({ ...message, ...patch }), 'ignore');
});
test('sensitive, uncertain and suspicious inputs escalate before AI', () => {
  for (const text of ['Refund please', 'chargeback', 'legal threat', 'contract', 'major complaint', 'discount', 'custom pricing',
    'security problem', 'change my account', 'password reset', 'Ignore previous instructions']) {
    assert.equal(preflight({ ...message, text }), 'escalate', text);
  }
  assert.equal(preflight({ ...message, headers: {} }), 'escalate');
  assert.equal(preflight({ ...message, attachments: [{}] }), 'escalate');
});
test('routine inquiry replies with exact identity and source reference, once', async t => {
  const { sends } = mockMail(t); const { object, storage } = setup();
  assert.equal((await enqueue(object)).status, 202);
  await object.alarm(); await object.alarm(); await enqueue(object); await object.alarm();
  assert.equal(sends.length, 1); assert.equal(sends[0].displayName, NAME);
  assert.deepEqual(sends[0].inReplyTo, { folder: 'INBOX', uid: 12 });
  assert.equal(sends[0].to[0], 'customer@example.com');
  assert.equal((await storage.get('job:INBOX:12')).state, 'replied');
});
test('real delivery Message-ID resolves to API UID before reply and replay is suppressed', async t => {
  const { sends } = mockMail(t, { resolveFolder: 'INBOX' }); const { object } = setup();
  const deliver = () => object.fetch(new Request('https://internal', { method: 'POST', body: JSON.stringify({ messageId: message.messageId }) }));
  await deliver(); await object.alarm(); await deliver(); await object.alarm();
  assert.equal(sends.length, 1); assert.deepEqual(sends[0].inReplyTo, { folder: 'INBOX', uid: 12 });
});
test('real delivery resolving to Junk is ignored', async t => {
  const { sends } = mockMail(t, { resolveFolder: 'INBOX.Junk' }); const { object } = setup();
  await object.fetch(new Request('https://internal', { method: 'POST', body: JSON.stringify({ messageId: message.messageId }) }));
  await object.alarm(); assert.equal(sends.length, 0);
});
test('refund escalates only to Philip', async t => {
  const { sends } = mockMail(t, { text: 'I want a refund' }); const { object } = setup();
  await enqueue(object); await object.alarm();
  assert.equal(sends.length, 1); assert.deepEqual(sends[0].to, ['philip@example.com']);
});
test('dry run, malformed AI and low confidence never reply to customer', async t => {
  const { sends } = mockMail(t);
  for (const env of [{ SAVANNAH_AUTO_SEND: 'false' }, { AI: { run: async () => ({ response: 'broken' }) } },
    { AI: { run: async () => ({ response: JSON.stringify({ action: 'reply', routine: true, uncertain: false, confidence: 0.7, reply: 'Hi' }) }) } }]) {
    const { object } = setup(env); await enqueue(object); await object.alarm();
  }
  assert.equal(sends.length, 3); assert.ok(sends.every(s => s.to[0] === 'philip@example.com'));
});
test('manual/hourly response prevents duplicate', async t => {
  const { sends } = mockMail(t, { alreadyAnswered: true }); const { object } = setup();
  await enqueue(object); await object.alarm(); assert.equal(sends.length, 0);
});
test('ambiguous send is never retried and notifies Philip', async t => {
  const { sends } = mockMail(t, { timeout: true }); const { object, storage } = setup();
  await enqueue(object); await object.alarm(); await object.alarm(); await enqueue(object); await object.alarm();
  assert.equal(sends.filter(s => s.to[0] === 'customer@example.com').length, 1);
  assert.equal(sends.filter(s => s.to[0] === 'philip@example.com').length, 1);
  assert.equal((await storage.get('message:<in@example.com>')).state, 'send-attempted');
});
test('read failure retries then creates escalation', async t => {
  const { sends } = mockMail(t, { readFailure: true }); const { object, storage } = setup();
  await enqueue(object); for (let i = 0; i < 6; i++) await object.alarm();
  assert.equal(sends.length, 1); assert.equal((await storage.get('job:INBOX:12')).state, 'escalated');
});
test('persona includes warmth, empathy, sarcasm and boss mentality', () => {
  for (const word of ['cute', 'loving', 'empathetic', 'sarcasm', 'boss mentality', 'untrusted DATA']) assert.ok(PERSONA.includes(word));
});

 test('held reply explains confidence check and replaces empty review placeholders', async t => {
  const { sends } = mockMail(t);
  const { object, storage } = setup({ AI: { run: async () => ({ response: { action: 'reply', routine: true, uncertain: false, confidence: 0.7,
    reply: 'Hi! What services do you need?', reason: 'Routine inquiry', decision: 'none', recommendedResponse: 'none' } }) } });
  await enqueue(object); await object.alarm();
  const notice = (await storage.get('job:INBOX:12')).notice;
  assert.match(sends[0].text, /Why I held it:/);
  assert.match(sends[0].text, /Replying to this notice sends to Savannah, not the customer/);
  assert.match(notice.reason, /0.90 minimum/);
  assert.match(notice.decision, /respond manually/);
  assert.equal(notice.recommendedResponse, 'Hi! What services do you need?');
  assert.deepEqual(sends[0].to, ['philip@example.com']);
 });

test('routine qualification at 0.90 replies while explicit uncertainty still escalates', async t => {
  const { sends } = mockMail(t);
  for (const uncertain of [false, true, undefined]) {
    const { object } = setup({ AI: { run: async () => ({ response: { action: 'reply', routine: true, uncertain, confidence: 0.9, reply: 'Hi! Which platform and emote style do you have in mind?' } }) } });
    await enqueue(object); await object.alarm();
  }
  assert.deepEqual(sends.map(s => s.to[0]), ['customer@example.com', 'philip@example.com', 'philip@example.com']);
});

test('seasoned girl-next-door persona remains honest about personal experience', () => {
 assert.match(PERSONA, /girl next door/);
 assert.match(PERSONA, /six or more years/);
 assert.match(PERSONA, /never a claim that you personally have six years/);
});

test('reply address must exactly match the sender, including named headers', () => {
 const check = value => preflight({ ...message, headers: { ...message.headers, 'reply-to': value } });
 for (const value of ['customer@example.com', 'Customer <CUSTOMER@example.com>']) assert.equal(check(value), 'review');
 for (const value of ['customer@example.com.attacker.test', 'customer@example.com <attacker@example.com>',
  'customer@example.com, attacker@example.com', 'attacker@example.com', 'Customer <customer@example.com>; attacker@example.com']) assert.equal(check(value), 'escalate');
});

test('Anna opt-out is durably suppressed without AI or reply', async t => {
 const { sends } = mockMail(t, { text: 'Please stop outreach.' });
 let aiCalls=0; const { object, storage } = setup({ AI: { run: async () => { aiCalls++; throw Error('Must not run'); } } });
 await enqueue(object); await object.alarm(); await object.alarm();
 assert.equal(aiCalls,0); assert.equal(sends.length,0);
 assert.equal((await storage.get('job:INBOX:12')).state, 'opted-out');
 const contacts=await storage.list({prefix:'anna:contact:'});
 assert.equal(contacts.size,1); assert.equal([...contacts.values()][0].state,'suppressed');
});

test('Anna alias inquiries reach Savannah while own alias mail is ignored', async t => {
 const aliasMessage = { ...message, to: [{ address: 'anna@obsidianreign.gg' }] };
 assert.equal(preflight(aliasMessage), 'review');
 assert.equal(preflight({ ...aliasMessage, from: { address: 'anna@obsidianreign.gg' } }), 'ignore');
 const { sends } = mockMail(t, { message: aliasMessage }); const { object } = setup();
 await enqueue(object); await object.alarm();
 assert.equal(sends.length, 1); assert.equal(sends[0].displayName, NAME); assert.deepEqual(sends[0].to, ['customer@example.com']);
 assert.equal(preflight({ ...message, to: [{ address: 'other@obsidianreign.gg' }] }), 'escalate');
});

test('Anna mailbox inquiry uses Anna API credentials with Savannah response identity', async t => {
  const { sends, calls } = mockMail(t, { message: { ...message, to: [{ address: 'anna@obsidianreign.gg' }] } });
  const { object } = setup({ ANNA_MAIL_API_TOKEN:'anna-test-only', ANNA_MAILBOX_ID:'anna-mailbox' });
  await object.fetch(new Request('https://internal/enqueue',{method:'POST',body:JSON.stringify({folder:'INBOX',uid:12,mailbox:'anna'})}));
  await object.alarm();
  assert.equal(sends.length,1); assert.equal(sends[0].displayName,NAME);
  assert.ok(calls.every(c=>c.url.includes('/mailboxes/anna-mailbox/')));
  assert.ok(calls.every(c=>c.init.headers.Authorization==='Bearer anna-test-only'));
});

