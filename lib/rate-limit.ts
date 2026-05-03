import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Singleton — instantiated once per Edge worker lifetime.
// Returns null when Upstash credentials are absent so the middleware
// degrades gracefully in dev without crashing.
let _limiter: Ratelimit | null | undefined

export function getPinRateLimiter(): Ratelimit | null {
  if (_limiter !== undefined) return _limiter

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    _limiter = null
    return null
  }

  _limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    // 10 attempts per IP per 60-second sliding window
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: false,
    prefix: 'kid-hub:pin',
  })

  return _limiter
}
