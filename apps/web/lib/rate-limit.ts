import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Runs a limiter check, failing OPEN on backend errors.
 *
 * Returns the limit result, or `null` when the request should simply be allowed:
 * either there is no limiter (dev/test without Upstash) or the limiter backend
 * was unreachable at runtime. A rate-limiter outage must not break login/PIN/
 * game-save endpoints — missing *configuration* is still caught at startup by the
 * getters below (production throws), this only covers a transient runtime outage.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult | null> {
  if (!limiter) return null
  try {
    return await limiter.limit(identifier)
  } catch (err) {
    console.warn('[rate-limit] limiter backend unavailable, allowing request:', err)
    return null
  }
}

/**
 * Reads the Upstash REST credentials shared by every limiter.
 *
 * In production, missing credentials is a HARD error: a silently unthrottled
 * login / PIN / game-save endpoint is a security hole, so we fail loudly the
 * first time a limiter is needed rather than degrading to a no-op. In
 * development and tests the limiter degrades to `null` (no-op) so local work
 * needs no Upstash account.
 */
function readUpstashCredentials(purpose: string): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) return { url, token }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `Rate limiting is misconfigured: UPSTASH_REDIS_REST_URL and ` +
        `UPSTASH_REDIS_REST_TOKEN must be set in production (needed by: ${purpose}).`
    )
  }

  return null
}

// Singleton — instantiated once per Edge worker lifetime.
// null when Upstash credentials are absent (dev/test only) so the middleware
// degrades gracefully without crashing; throws in production (see above).
let _limiter: Ratelimit | null | undefined

export function getPinRateLimiter(): Ratelimit | null {
  if (_limiter !== undefined) return _limiter

  const creds = readUpstashCredentials('web PIN/login gate')
  if (!creds) {
    _limiter = null
    return null
  }

  _limiter = new Ratelimit({
    redis: new Redis(creds),
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

  const creds = readUpstashCredentials('mobile /api/v1/auth/login')
  if (!creds) {
    _loginLimiter = null
    return null
  }

  _loginLimiter = new Ratelimit({
    redis: new Redis(creds),
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

  const creds = readUpstashCredentials('kid game-save /api/v1/{math,english}')
  if (!creds) {
    _gameSaveLimiter = null
    return null
  }

  _gameSaveLimiter = new Ratelimit({
    redis: new Redis(creds),
    limiter: Ratelimit.slidingWindow(30, '60 s'),
    analytics: false,
    prefix: 'kid-hub:api-game-save',
  })

  return _gameSaveLimiter
}
