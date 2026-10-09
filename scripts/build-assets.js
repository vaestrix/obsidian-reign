import { mkdir, readdir, copyFile, cp } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of await readdir('.')) {
  if (file.endsWith('.html') || ['robots.txt', 'sitemap.xml'].includes(file)) {
    await copyFile(file, `dist/${file}`);
  }
}
await cp('assets', 'dist/assets', { recursive: true });
console.log('Public site assets prepared in dist.');
