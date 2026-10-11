import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { prepareBatch } from '../src/anna.js';
const [command, path] = process.argv.slice(2);
if (command !== 'prepare' || !path) throw Error('Usage: node scripts/anna-agent.mjs prepare INPUT_JSON');
const input = JSON.parse(await readFile(path, 'utf8'));
const batch = prepareBatch(input.campaign, input.leads);
await mkdir(new URL('../.wrangler/anna/', import.meta.url), { recursive: true });
const output = new URL('../.wrangler/anna/pending-batch.json', import.meta.url);
await writeFile(output, JSON.stringify(batch, null, 2));
console.log(`Anna prepared ${batch.messages.length} messages for review. No email sent. Private batch saved under .wrangler/anna/pending-batch.json.`);

