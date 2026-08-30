import 'server-only'

import {
  canAccessStudent,
  isAdmin,
  verifyKidSessionToken,
  verifyParentAccessToken,
} from '@/server/services/auth.service'

/**
 * Bearer-transport guards for REST route handlers.
 *
 * They return null rather than throwing so a handler can answer with a 401 or
 * 403 in one line instead of wrapping every call in try/catch.
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

const bearer = (req: Request): string | null => {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token || null
}

/** WHO is calling. Identity only — says nothing about which student they may read. */
export const requireParentApi = async (req: Request): Promise<{ parentId: string } | null> => {
  const token = bearer(req)
  if (!token) return null

  const session = await verifyParentAccessToken(token)
  return session ? { parentId: session.parentId } : null
}

/**
 * WHO, plus MAY they touch this student. Every student-scoped write goes through
 * here — the join-table check is what stops one household reaching another's data.
 */
export const requireStudentApi = async (
  req: Request,
  studentId: string
): Promise<{ parentId: string } | null> => {
  const parent = await requireParentApi(req)
  if (!parent) return null
  if (!(await canAccessStudent(parent.parentId, studentId))) return null
  return parent
}

/**
 * Read access to a student's data, from either side of the app: a parent linked
 * to that student, OR a kid session whose own studentId matches. This is the
 * guard for the routes the kid app calls, which today have no guard at all.
 */
export const requireStudentReadApi = async (
  req: Request,
  studentId: string
): Promise<{ actor: 'parent' | 'kid' } | null> => {
  const token = bearer(req)
  if (!token) return null

  const parentSession = await verifyParentAccessToken(token)
  if (parentSession) {
    return (await canAccessStudent(parentSession.parentId, studentId))
      ? { actor: 'parent' }
      : null
  }

  const kidSession = await verifyKidSessionToken(token)
  if (kidSession) return kidSession.studentId === studentId ? { actor: 'kid' } : null

  return null
}

/** Admin surface. A plain parent session is not enough. */
export const requireAdminApi = async (req: Request): Promise<{ parentId: string } | null> => {
  const parent = await requireParentApi(req)
  if (!parent) return null
  return (await isAdmin(parent.parentId)) ? parent : null
}
