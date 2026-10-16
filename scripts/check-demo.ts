import { readFile, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = (process.env.BASE_PATH ?? '/').replace(/\/$/, '') + '/';
for (const route of ['index.html', 'demo/index.html']) {
  const html = await readFile('site-dist/' + route, 'utf8');
  assert(html.includes(`name="site-base" content="${base}"`), 'Missing base metadata');
  const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1]);
  assert(assets.some(asset => asset.endsWith('.js')), 'Missing JS bundle');
  assert(assets.some(asset => asset.endsWith('.css')), 'Missing CSS bundle');
  for (const asset of assets) {
    assert(asset.startsWith(base), `Asset escapes site base: ${asset}`);
    assert((await stat('site-dist/' + asset.slice(base.length))).isFile());
  }
}
for (const file of ['icons/terracotta.svg', 'icons/sage.svg', 'icons/clay.svg', 'icons/leaf.svg', 'icons/globe.svg', 'icons/arrow.svg', 'icons/mail.svg', '.nojekyll']) {
  assert((await stat('site-dist/' + file)).isFile(), `Missing static file: ${file}`);
}
console.log(`Static routes and assets verified for ${base}`);
