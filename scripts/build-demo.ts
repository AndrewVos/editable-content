import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import tailwind from 'bun-plugin-tailwind';

const input = process.env.BASE_PATH ?? '/';
if (!/^\/(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]*$/.test(input) || input.split('/').some(part => part === '.' || part === '..')) {
  throw new Error('BASE_PATH must be an absolute URL path such as / or /editable-content/');
}
const base = input.endsWith('/') ? input : input + '/';
await rm('site-dist', { recursive: true, force: true });
const result = await Bun.build({
  entrypoints: ['demo/index.html'],
  outdir: 'site-dist',
  target: 'browser',
  plugins: [tailwind],
  minify: true,
  publicPath: base,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
});
if (!result.success) throw new AggregateError(result.logs, 'Demo build failed');
const html = (await readFile('site-dist/index.html', 'utf8'))
  .replace('<head>', `<head><meta name="site-base" content="${base}">`);
await mkdir('site-dist/demo', { recursive: true });
await writeFile('site-dist/index.html', html);
await writeFile('site-dist/demo/index.html', html);
await writeFile('site-dist/.nojekyll', '');
await cp('demo/icons', 'site-dist/icons', { recursive: true });
console.log(`Static demo built in site-dist for ${base}`);
