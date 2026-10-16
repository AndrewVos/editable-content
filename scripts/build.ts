import { mkdir, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const entrypoint of ['src/index.ts', 'src/core.ts']) {
  const result = await Bun.build({ entrypoints: [entrypoint], outdir: 'dist', target: 'browser', external: ['react', 'react-dom'], ...(entrypoint.endsWith('index.ts') ? { banner: '"use client";' } : {}) });
  if (!result.success) throw new AggregateError(result.logs, 'Build failed');
}
const types = Bun.spawn(['bun', '--bun', 'tsc', '-p', 'tsconfig.build.json'], { stdout: 'inherit', stderr: 'inherit' });
if (await types.exited !== 0) process.exit(1);
console.log('Built ESM, TypeScript declarations, with no bundled UI or CSS.');
