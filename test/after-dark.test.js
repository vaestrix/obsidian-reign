import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PERSONA } from '../src/savannah.js';
import worker from '../src/worker.js';

test('After Dark defaults to non-suggestive assets and warns about verification', async () => {
  const html = await readFile(new URL('../after-dark.html', import.meta.url), 'utf8');
  assert.match(html, /non-suggestive by default/i);
  assert.match(html, /No age-verification provider is connected yet/i);
  assert.match(html, /not identity verification/i);
  assert.match(html, /noindex,nofollow/i);
  assert.match(html, /Contact Us Now/i);
});

test('Savannah must escalate suggestive requests and avoid collecting identity documents', () => {
  assert.match(PERSONA, /independent age verification/i);
  assert.match(PERSONA, /Escalate all suggestive-content requests/i);
  assert.match(PERSONA, /must not collect ID documents/i);
});

test('After Dark HTTP response is not indexable', async () => {
  const response = await worker.fetch(new Request('https://obsidianreign.gg/after-dark'), {
    ASSETS: { fetch: async () => new Response('<html></html>', {headers:{'Content-Type':'text/html'}}) }
  });
  assert.match(response.headers.get('X-Robots-Tag') || '', /noindex/);
});

test('Black Rose camera prototype is transparent and the showcase uses its rendered artwork', async () => {
  const svg = await readFile(new URL('../assets/img/after-dark-black-rose-camera-frame.svg', import.meta.url), 'utf8');
  const html = await readFile(new URL('../after-dark.html', import.meta.url), 'utf8');
  assert.match(svg, /viewBox="0 0 1920 1080"/);
  assert.doesNotMatch(svg, /<rect[^>]*width="1920"[^>]*height="1080"/);
  assert.match(html, /src="\/assets\/img\/after-dark-black-rose-camera-v1\.png"/);
  assert.match(html, /transparent opening/i);
});
