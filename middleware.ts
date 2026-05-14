/**
 * Next.js Edge Middleware — responsibilities:
 * 1. Kid / hub routes: clear `parent_session` on real navigation (not Link prefetch) so every
 *    return to `/parent` from the kid app requires PIN again.
 * 2. Rate-limit PIN verification attempts (POST /parent/pin) via Upstash sliding window.
 *    Degrades gracefully when UPSTASH_* env vars are absent (dev without credentials).
 * 3. Verify the signed HttpOnly session cookie before granting access to /parent/*.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { getPinRateLimiter } from '@/lib/rate-limit'

const SESSION_COOKIE = 'parent_session'

/** Paths where the parent PIN session must not survive (re-entering /parent requires PIN). */
const isKidAppSurfacePath = (pathname: string): boolean => {
  if (pathname === '/') return true
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return true
  if (pathname === '/schedule' || pathname.startsWith('/schedule/')) return true
  if (pathname === '/grades' || pathname.startsWith('/grades/')) return true
  if (pathname === '/homework' || pathname.startsWith('/homework/')) return true
  if (pathname === '/math' || pathname.startsWith('/math/')) return true
  if (pathname === '/english' || pathname.startsWith('/english/')) return true
  return false
}

/**
 * Next.js may prefetch `<Link href>` targets in the background. Do not strip the parent session
 * on prefetch — the user has not left parent mode yet.
 */
const isNextPrefetch = (request: NextRequest): boolean => {
  const h = request.headers
  if (h.get('next-router-prefetch') === '1') return true
  if (h.get('Next-Router-Prefetch') === '1') return true
  const purpose = h.get('Purpose') ?? h.get('Sec-Purpose')
  return purpose?.toLowerCase() === 'prefetch'
}

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

  // ── Kid app: invalidate parent session (PIN gate on next /parent visit) ─
  if (isKidAppSurfacePath(pathname)) {
    if (!isNextPrefetch(request)) {
      const res = NextResponse.next()
      res.cookies.delete(SESSION_COOKIE)
      return res
    }
    return NextResponse.next()
  }

  // ── Allow non-POST access to /parent/pin (public login page) ───────────
  if (pathname === '/parent/pin' && request.method !== 'POST') {
    return NextResponse.next()
  }

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
    '/',
    '/dashboard/:path*',
    '/schedule/:path*',
    '/grades/:path*',
    '/homework/:path*',
    '/math/:path*',
    '/english/:path*',
    '/parent',
    '/parent/((?!pin).*)',
    '/parent/pin',
  ],
}
