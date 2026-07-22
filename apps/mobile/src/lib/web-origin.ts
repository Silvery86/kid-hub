// web-origin.ts — base origin for heavy game media served from web `/public`
// (decision #3). Derived from EXPO_PUBLIC_API_URL by stripping the `/api/v1`
// suffix, or set EXPO_PUBLIC_WEB_ORIGIN explicitly (e.g. a CDN) — the single
// place that changes for a CDN migration.
import { assetUrl } from '@kid-hub/assets'

const deriveOrigin = (): string => {
  const explicit = process.env.EXPO_PUBLIC_WEB_ORIGIN
  if (explicit) return explicit.replace(/\/$/, '')
  const api = process.env.EXPO_PUBLIC_API_URL ?? ''
  return api.replace(/\/api\/v1\/?$/, '')
}

export const WEB_ORIGIN = deriveOrigin()

/** Absolute URL for an origin-relative game-media path, against the web origin. */
export const mediaUrl = (path: string): string => assetUrl(WEB_ORIGIN, path)
