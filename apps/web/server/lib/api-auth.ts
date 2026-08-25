import 'server-only'

import { verifyParentAccessToken } from '@/server/services/auth.service'

/**
 * Parent guard for REST route handlers.
 *
 * Returns null rather than throwing (the previous signature) so a handler can
 * answer with a 401 in one line instead of wrapping every call in try/catch.
 *
 * `requireParentSession` in auth-guard.ts reads the parent cookies and rotates
 * them, which only works for the web app. Mobile sends the access token as a
 * Bearer header and cannot receive a Set-Cookie rotation, so it needs its own
 * guard. Both verify the same JWT with the same secret and the same `typ`
 * claim — only the transport differs.
 *
 * There is deliberately no refresh fallback here: the mobile client already
 * refreshes on a 401 via its axios interceptor, and rotating a refresh token
 * inside an arbitrary mutation would hand the new pair to a response body that
 * the caller is not expecting.
 */
export const requireParentApi = async (req: Request): Promise<{ userId: string } | null> => {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null

  const token = header.slice('Bearer '.length).trim()
  if (!token) return null

  const session = await verifyParentAccessToken(token)
  return session ? { userId: session.userId } : null
}
