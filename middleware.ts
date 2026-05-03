/**
 * Next.js Edge Middleware — two responsibilities:
 * 1. Rate-limit PIN verification attempts (POST /parent/pin) via Upstash sliding window.
 *    Degrades gracefully when UPSTASH_* env vars are absent (dev without credentials).
 * 2. Verify the signed HttpOnly session cookie before granting access to /parent/*.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { getPinRateLimiter } from '@/lib/rate-limit'

const SESSION_COOKIE = 'parent_session'

/** Returns the JWT secret encoded as Uint8Array. Throws if SESSION_SECRET is absent or too short. */
const getSecret = (): Uint8Array => {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET env var must be set and at least 32 characters long.')
  }
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // ── Rate limiting: PIN verification Server Action POSTs ─────────────────
  if (pathname === '/parent/pin' && request.method === 'POST') {
    const limiter = getPinRateLimiter()
    if (limiter) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
      const { success, limit, remaining, reset } = await limiter.limit(ip)
      if (!success) {
        return new NextResponse('Too many PIN attempts. Please wait and try again.', {
          status: 429,
          headers: {
            'Content-Type': 'text/plain',
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          },
        })
      }
    }
    return NextResponse.next()
  }

  // ── Session verification: protected /parent/* routes ────────────────────
  const token = request.cookies.get(SESSION_COOKIE)?.value

  if (token) {
    try {
      await jwtVerify(token, getSecret())
      return NextResponse.next()
    } catch {
      const response = NextResponse.redirect(new URL('/parent/pin', request.url))
      response.cookies.delete(SESSION_COOKIE)
      return response
    }
  }

  return NextResponse.redirect(new URL('/parent/pin', request.url))
}

export const config = {
  matcher: [
    // Protect all /parent/* sub-paths except /parent/pin (the public PIN page)
    '/parent/((?!pin).*)',
    // Also run middleware on /parent/pin to apply the PIN rate limiter
    '/parent/pin',
  ],
}
