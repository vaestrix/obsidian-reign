// Local-only runtime check. No Mail API token or remote AI request is used.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const secret = 'local-test-only-'.repeat(3);
const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', '--local', '--port', '8789',
  '--compatibility-date', '2026-10-03', '--var', `HOSTINGER_WEBHOOK_SECRET:${secret}`], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
child.stdout.on('data', b => { output += b; }); child.stderr.on('data', b => { output += b; });
try {
  const until = Date.now() + 90000;
  let ready = false;
  while (Date.now() < until) {
    try { await fetch('http://127.0.0.1:8789/webhooks/hostinger', { signal: AbortSignal.timeout(1000) }); ready = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 500)); }
  }
  if (!ready) throw new Error('Runtime not ready: ' + output.slice(-3000));
  for (const [path, status] of [['/', 200], ['/pricing', 200], ['/missing-qa-page', 404], ['/src/savannah.js', 404],
    ['/docs/savannah-deployment.md', 404], ['/pnpm-workspace.yaml', 404], ['/pnpm-lock.yaml', 404]]) {
    const r = await fetch('http://127.0.0.1:8789' + path, { signal: AbortSignal.timeout(10000) });
    assert.equal(r.status, status, path); console.log(path, r.status);
  }
  const post = token => fetch('http://127.0.0.1:8789/webhooks/hostinger', { method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ event: 'message.received', mailbox: { id: 'ACea1da873df8cf8ce1839b3cae221' }, message: { uid: 7654321, path: 'INBOX' } }),
    signal: AbortSignal.timeout(10000) });
  assert.equal((await post('wrong')).status, 401);
  const first = await post(secret); assert.equal(first.status, 202); assert.equal((await first.json()).accepted, true);
  const duplicate = await post(secret); assert.equal(duplicate.status, 202); assert.equal((await duplicate.json()).duplicate, true);
  console.log('Webhook: wrong token 401; accepted 202; duplicate 202');
} finally { child.kill(); }
