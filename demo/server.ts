import index from './index.html';
const server = Bun.serve({ port: 3000, routes: {
  '/icons/terracotta.svg': () => new Response(Bun.file('demo/icons/terracotta.svg')),
  '/icons/sage.svg': () => new Response(Bun.file('demo/icons/sage.svg')),
  '/icons/clay.svg': () => new Response(Bun.file('demo/icons/clay.svg')),
  '/icons/leaf.svg': () => new Response(Bun.file('demo/icons/leaf.svg')),
  '/icons/globe.svg': () => new Response(Bun.file('demo/icons/globe.svg')),
  '/icons/arrow.svg': () => new Response(Bun.file('demo/icons/arrow.svg')),
  '/icons/mail.svg': () => new Response(Bun.file('demo/icons/mail.svg')),
  '/': index,
  '/demo': index,
  '/demo/': index,
  '/demo/source/templates': () => new Response(Bun.file('demo/blocks/templates.ts'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }),
  '/demo/source/renderers': () => new Response(Bun.file('demo/blocks/renderers.tsx'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }),
  '/demo/source/ContentArea': () => new Response(Bun.file('demo/blocks/ContentArea.tsx'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }),
}, development: { hmr: true, console: true } });
console.log(`Demo running at ${server.url}`);
