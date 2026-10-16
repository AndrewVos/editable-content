// The static build injects this metadata; Bun's local server uses the root path.
export const basePath = typeof document === 'undefined'
  ? '/'
  : document.querySelector<HTMLMetaElement>('meta[name="site-base"]')?.content ?? '/';

export function siteUrl(path: string) {
  return basePath + path.replace(/^\/+/, '');
}
export function isDemoPath(pathname: string) {
  return pathname.replace(/\/$/, '') === siteUrl('demo');
}
