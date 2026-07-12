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

// Separate singleton for the mobile REST login route (/api/v1/auth/login),
// which is not covered by the middleware limiter above (the matcher excludes
// /api/*). Password login is stricter than the PIN gate: 5 attempts / 60 s.
let _loginLimiter: Ratelimit | null | undefined

export function getLoginRateLimiter(): Ratelimit | null {
  if (_loginLimiter !== undefined) return _loginLimiter

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    _loginLimiter = null
    return null
  }

  _loginLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    analytics: false,
    prefix: 'kid-hub:api-login',
  })

  return _loginLimiter
}

// Singleton for the kid-facing game-save routes (/api/v1/{math,english} POST),
// which — like /api/v1/auth/login — are outside the middleware matcher. Game
// saves are more frequent than logins but still bounded per IP: 30 / 60 s.
let _gameSaveLimiter: Ratelimit | null | undefined

export function getGameSaveRateLimiter(): Ratelimit | null {
  if (_gameSaveLimiter !== undefined) return _gameSaveLimiter

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    _gameSaveLimiter = null
    return null
  }

  _gameSaveLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(30, '60 s'),
    analytics: false,
    prefix: 'kid-hub:api-game-save',
  })

  return _gameSaveLimiter
}
