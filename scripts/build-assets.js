import { mkdir, readdir, copyFile, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(root, 'dist');
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== 'dist') throw new Error('Invalid output directory');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of await readdir(root)) {
  if (file.endsWith('.html') || ['robots.txt', 'sitemap.xml'].includes(file)) {
    await copyFile(path.join(root, file), path.join(output, file));
  }
}
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
console.log('Public site assets prepared in dist.');
