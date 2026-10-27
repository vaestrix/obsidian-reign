import { mkdir, readdir, copyFile, cp, rm, readFile, writeFile, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
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
// Use Wrangler's installed compiler; resolving its real path also supports pnpm.
const wranglerRequire = createRequire(await realpath(path.join(root, 'node_modules/wrangler/package.json')));
const { transform } = wranglerRequire('esbuild');
const coreCss = await Promise.all(['studio', 'polish', 'launch'].map(name => readFile(path.join(root, 'assets/css', name + '.css'), 'utf8')));
const cssBundle = await transform(coreCss.join('\n'), { loader: 'css', minify: true, charset: 'utf8' });
await writeFile(path.join(output, 'assets/css/public.css'), cssBundle.code);
await import('./build-pages.js');
// Standardize favicon metadata on every generated and retained page.
async function updateIcons(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'assets') await updateIcons(target); }
    else if (entry.name.endsWith('.html')) {
      const html = (await readFile(target, 'utf8'))
        .replace(/<link rel="stylesheet" href="\/?assets\/css\/studio\.css[^"]*">\s*<link rel="stylesheet" href="\/?assets\/css\/polish\.css[^"]*">\s*<link rel="stylesheet" href="\/?assets\/css\/launch\.css[^"]*">/g, '<link rel="stylesheet" href="/assets/css/public.css?v=savannah-ad-20261027">')
        .replaceAll('<a class="brand" href="/">','<a class="brand" href="/" aria-label="Obsidian Reign Studios home">')
        .replace(/(<span class="header-logo"><img src="[^"]*)studio-logo\.png/g,'$1studio-logo-header.webp')
        .replace(/(\/?assets\/(?:css\/launch\.css|js\/(?:studio|intake|brief-tools)\.js))\?v=[^"']+/g,'$1?v=launch-20261026')
        .replaceAll('assets/js/studio.js?v=launch-20261026','assets/js/studio.js?v=site-loops-20261027')
        .replace(/<link\b[^>]*rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]*>/gi, '');
      await writeFile(target, html.replace('</head>', '<link rel="icon" type="image/svg+xml" sizes="any" href="/assets/img/favicon.svg?v=or20261010"><link rel="apple-touch-icon" href="/assets/img/studio-logo.png"></head>'));
    }
  }
}
await updateIcons(output);
console.log('Public site assets and service pages prepared in dist.');
