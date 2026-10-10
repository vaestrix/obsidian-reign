import { mkdir, readdir, copyFile, cp, rm, readFile, writeFile } from 'node:fs/promises';
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
await import('./build-pages.js');
// Standardize favicon metadata on every generated and retained page.
async function updateIcons(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'assets') await updateIcons(target); }
    else if (entry.name.endsWith('.html')) {
      const html = (await readFile(target, 'utf8')).replace(/<link\b[^>]*rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]*>/gi, '');
      await writeFile(target, html.replace('</head>', '<link rel="icon" type="image/svg+xml" sizes="any" href="/assets/img/favicon.svg?v=or20261010"><link rel="apple-touch-icon" href="/assets/img/studio-logo.png"></head>'));
    }
  }
}
await updateIcons(output);
console.log('Public site assets and service pages prepared in dist.');
