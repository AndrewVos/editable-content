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
}, development: { hmr: true, console: true } });
console.log(`Demo running at ${server.url}`);
