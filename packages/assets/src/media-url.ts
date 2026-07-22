/**
 * Join an origin-relative asset path onto a base origin. Web calls this with an
 * empty base (same-origin, path returned unchanged); mobile passes the web origin
 * (or, later, a CDN base — the one place that changes for a CDN move).
 */
export const assetUrl = (base: string, path: string): string => {
  if (!base) return path
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`
}
