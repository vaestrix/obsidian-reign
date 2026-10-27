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
const compactAssets=JSON.parse(await readFile(path.join(root,'assets/compact-assets.json'),'utf8'));
const compact=text=>Object.entries(compactAssets).reduce((value,[from,to])=>value.replaceAll(from,to).replaceAll(from.slice(1),to.slice(1)),text);
// Compress delivery copies only: source files stay readable and artwork is lossless.
for(const entry of await readdir(path.join(output,'assets/js'))){if(entry.endsWith('.js')){const target=path.join(output,'assets/js',entry);const result=await transform(compact(await readFile(target,'utf8')),{loader:'js',minify:true,target:'es2020',charset:'utf8'});await writeFile(target,result.code);}}
for(const entry of await readdir(path.join(output,'assets/css'))){if(entry.endsWith('.css')){const target=path.join(output,'assets/css',entry);let css=compact(await readFile(target,'utf8')).replace(/(-compact\.woff2\)\s*format\(')(?:truetype|woff)('\))/g,"$1woff2$2");const result=await transform(css,{loader:'css',minify:true,charset:'utf8'});await writeFile(target,result.code);}}
const coreCss = await Promise.all(['studio', 'polish', 'launch'].map(name => readFile(path.join(output, 'assets/css', name + '.css'), 'utf8')));
const cssBundle = await transform(coreCss.join('\n'), { loader: 'css', minify: true, charset: 'utf8' });
await writeFile(path.join(output, 'assets/css/public.css'), cssBundle.code);
await import('./build-pages.js');
// Standardize favicon metadata on every generated and retained page.
async function updateIcons(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'assets') await updateIcons(target); }
    else if (entry.name.endsWith('.html')) {
      let imageIndex=0;
      const html = compact(await readFile(target, 'utf8'))
        .replace(/<link rel="stylesheet" href="\/?assets\/css\/studio\.css[^"]*">\s*<link rel="stylesheet" href="\/?assets\/css\/polish\.css[^"]*">\s*<link rel="stylesheet" href="\/?assets\/css\/launch\.css[^"]*">/g, '<link rel="stylesheet" href="/assets/css/public.css?v=mobile-perf-20261027">')
        .replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, markup=>markup.includes('data-feature-video')?markup.replace(/preload="[^"]*"/g,'preload="none"'):markup.replace(/\bsrc="([^"]+)"/g,'data-preview-src="$1"').replace(/preload="[^"]*"/g,'preload="none"'))
        .replace(/<video\b[^>]*>/gi, tag=>tag.includes('data-hero-video')?tag:tag.replace(/\bposter=/g,'data-preview-poster='))
        .replace(/<img\b[^>]*>/gi, tag=>{imageIndex++;if(!tag.includes('decoding='))tag=tag.replace('<img','<img decoding="async"');if(imageIndex>2&&!tag.includes('loading='))tag=tag.replace('<img','<img loading="lazy"');return tag;})
        .replaceAll('<a class="brand" href="/">','<a class="brand" href="/" aria-label="Obsidian Reign Studios home">')
        .replace(/(<span class="header-logo"><img\b[^>]*?src="[^"]*)studio-logo\.png/g,'$1studio-logo-header.webp')
        .replace(/(\/?assets\/(?:css\/launch\.css|js\/(?:studio|intake|brief-tools)\.js))\?v=[^"']+/g,'$1?v=launch-20261026')
        .replaceAll('assets/js/studio.js?v=launch-20261026','assets/js/studio.js?v=mobile-perf-20261027')
        .replace(/(assets\/css\/after-dark-editorial\.css)\?v=[^"']+/g,'$1?v=mobile-perf-20261027')
        .replace(/<link\b[^>]*rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]*>/gi, '');
      await writeFile(target, html.replace('</head>', '<link rel="icon" type="image/svg+xml" sizes="any" href="/assets/img/favicon.svg?v=or20261010"><link rel="apple-touch-icon" href="/assets/img/studio-logo.png"></head>'));
    }
  }
}
await updateIcons(output);
console.log('Public site assets and service pages prepared in dist.');
