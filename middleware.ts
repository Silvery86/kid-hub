/**
 * Next.js Edge Middleware — route protection for parent-mode paths.
 * Verifies the signed HttpOnly session cookie before granting access to /parent.
 * If the token is absent or invalid the user is redirected to /parent/pin,
 * the dedicated PIN entry page, so they can authenticate.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE = 'parent_session'

/** Returns the JWT secret encoded as Uint8Array. */
const getSecret = (): Uint8Array =>
  new TextEncoder().encode(
    process.env.SESSION_SECRET ?? 'dev-secret-change-in-production-minimum-32-chars!!'
  )

export async function middleware(request: NextRequest): Promise<NextResponse> {
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
  /**
   * Protect /parent and all sub-paths EXCEPT /parent/pin (the public PIN entry page).
   * Uses a negative lookahead to exclude /parent/pin from protection.
   */
  matcher: ['/parent/((?!pin).*)'],
}
