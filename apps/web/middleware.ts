/**
 * Next.js Edge Middleware — responsibilities:
 * 1. Protect child routes with `kid_session`, redirecting to `/kid-unlock` when absent/invalid.
 * 2. Protect parent routes with `parent_access`, minting a fresh access token from a
 *    valid `parent_refresh` when it expires. The refresh token itself is NOT rotated
 *    here (the Edge runtime can't persist the new hash to the DB); genuine rotation
 *    happens only in Node contexts — see the refresh branch in `_handle`.
 * 3. Rate-limit parent login attempts (POST /parent/login) via Upstash sliding window.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { getPinRateLimiter } from '@/lib/rate-limit'
import {
  KID_SESSION_COOKIE,
  PARENT_ACCESS_COOKIE,
  PARENT_ACCESS_TTL_SECONDS,
  PARENT_REFRESH_COOKIE,
} from '@/lib/constants'

const isKidAppSurfacePath = (pathname: string): boolean => {
  if (pathname === '/') return true
  if (pathname === '/dashboard') return true
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return true
  if (pathname === '/schedule' || pathname.startsWith('/schedule/')) return true
  if (pathname === '/grades' || pathname.startsWith('/grades/')) return true
  if (pathname === '/homework' || pathname.startsWith('/homework/')) return true
  if (pathname === '/games' || pathname.startsWith('/games/')) return true
  if (pathname === '/math' || pathname.startsWith('/math/')) return true
  if (pathname === '/english' || pathname.startsWith('/english/')) return true
  if (pathname === '/unlock' || pathname.startsWith('/unlock/')) return true
  return false
}

const isParentPublicPath = (pathname: string): boolean =>
  pathname === '/parent/login' || pathname === '/parent/pin'

const isParentProtectedPath = (pathname: string): boolean =>
  pathname === '/parent' ||
  (pathname.startsWith('/parent/') && !isParentPublicPath(pathname))

/** Returns the JWT secret encoded as Uint8Array. Throws if SESSION_SECRET is absent or too short. */
const getSecret = (): Uint8Array => {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET env var must be set and at least 32 characters long.')
  }
  return new TextEncoder().encode(secret)
}

const verifyToken = async (
  token: string,
  type: 'parent-access' | 'parent-refresh' | 'kid-session'
): Promise<{ userId: string } | null> => {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.typ !== type) return null
    if (typeof payload.userId !== 'string') return null
    return { userId: payload.userId }
  } catch {
    return null
  }
}

const createParentAccessToken = async (userId: string): Promise<string> =>
  new SignJWT({ userId, typ: 'parent-access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${PARENT_ACCESS_TTL_SECONDS}s`)
    .sign(getSecret())

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID()
  const response = await _handle(request)
  response.headers.set('X-Request-Id', requestId)
  return response
}

async function _handle(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // ── Child app protection: require kid unlock session ────────────────────
  if (isKidAppSurfacePath(pathname)) {
    const kidToken = request.cookies.get(KID_SESSION_COOKIE)?.value
    if (!kidToken) {
      return NextResponse.redirect(new URL('/kid-unlock', request.url))
    }

    const kidSession = await verifyToken(kidToken, 'kid-session')
    if (kidSession) {
      return NextResponse.next()
    }

    const response = NextResponse.redirect(new URL('/kid-unlock', request.url))
    response.cookies.delete(KID_SESSION_COOKIE)
    return response
  }

  // ── Public parent auth routes (login + PIN gate) ─────────────────────────
  if (isParentPublicPath(pathname) && request.method !== 'POST') {
    return NextResponse.next()
  }

  // ── Rate limiting: parent login / PIN Server Action POSTs ────────────────
  if (isParentPublicPath(pathname) && request.method === 'POST') {
    const limiter = getPinRateLimiter()
    if (limiter) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
      const { success, limit, remaining, reset } = await limiter.limit(ip)
      if (!success) {
        return new NextResponse('Too many login attempts. Please wait and try again.', {
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

  // ── Parent app protection: access token with refresh fallback ────────────
  if (!isParentProtectedPath(pathname)) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get(PARENT_ACCESS_COOKIE)?.value
  if (accessToken) {
    const accessSession = await verifyToken(accessToken, 'parent-access')
    if (accessSession) {
      return NextResponse.next()
    }
  }

  const refreshToken = request.cookies.get(PARENT_REFRESH_COOKIE)?.value
  if (refreshToken) {
    const refreshSession = await verifyToken(refreshToken, 'parent-refresh')
    if (refreshSession) {
      // Keep the session alive by minting only a short-lived ACCESS token from the
      // still-valid refresh JWT. We deliberately do NOT rotate the refresh token
      // here: the Edge runtime cannot reach the DB to persist the new hash, so a
      // rotated refresh cookie would diverge from users.refreshTokenHash — leaving
      // the old token still valid server-side (cosmetic rotation) and risking a
      // spurious logout on the next Server Action, whose DB-hash check would reject
      // the new cookie. Genuine refresh-token rotation (new hash persisted + old
      // token revoked) happens only in Node contexts: requireParentSession
      // (server/lib/auth-guard.ts) and the REST /api/v1/auth/refresh route.
      const newAccessToken = await createParentAccessToken(refreshSession.userId)
      const response = NextResponse.next()
      response.cookies.set(PARENT_ACCESS_COOKIE, newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: PARENT_ACCESS_TTL_SECONDS,
      })
      return response
    }
  }

  const response = NextResponse.redirect(new URL('/parent/login', request.url))
  response.cookies.delete(PARENT_ACCESS_COOKIE)
  response.cookies.delete(PARENT_REFRESH_COOKIE)
  return response
}

export const config = {
  matcher: [
    '/',
    '/kid-unlock',
    '/unlock',
    '/dashboard/:path*',
    '/schedule/:path*',
    '/grades/:path*',
    '/homework/:path*',
    '/games/:path*',
    '/math/:path*',
    '/english/:path*',
    '/parent/:path*',
  ],
}
