import 'server-only'

import { cookies } from 'next/headers'
import {
  PARENT_ACCESS_COOKIE,
  PARENT_REFRESH_COOKIE,
  KID_SESSION_COOKIE,
  verifyParentAccessToken,
  verifyKidSessionToken,
  canAccessStudent,
  createParentSession,
  listStudentsForParent,
  validateRefreshToken,
} from '@/server/services/auth.service'
import {
  ACTIVE_STUDENT_COOKIE,
  PARENT_ACCESS_TTL_SECONDS,
  PARENT_REFRESH_TTL_SECONDS,
} from '@/lib/constants'

const issueParentSessionCookies = async (parentId: string): Promise<void> => {
  const { accessToken, refreshToken } = await createParentSession(parentId)

  const cookieStore = await cookies()
  cookieStore.set(PARENT_ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PARENT_ACCESS_TTL_SECONDS,
    path: '/',
  })
  cookieStore.set(PARENT_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PARENT_REFRESH_TTL_SECONDS,
    path: '/',
  })
}

/**
 * Question 1 of 2: WHO is calling?
 *
 * Verifies the parent session using the access token, falling back to refresh
 * token rotation. Throws 'Unauthorized' if no valid session exists.
 *
 * This answers identity only. It says nothing about which student's data the
 * caller may touch — that is `requireStudentAccess`.
 */
export const requireParentSession = async (): Promise<{ parentId: string }> => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(PARENT_ACCESS_COOKIE)?.value

  if (accessToken) {
    const accessSession = await verifyParentAccessToken(accessToken)
    if (accessSession) return { parentId: accessSession.parentId }
  }

  const refreshToken = cookieStore.get(PARENT_REFRESH_COOKIE)?.value
  if (!refreshToken) throw new Error('Unauthorized')

  // validateRefreshToken checks the stored hash, the revocation flag, the expiry
  // AND the account state, so a suspended parent cannot rotate their way onward.
  const validated = await validateRefreshToken(refreshToken)
  if (!validated) throw new Error('Unauthorized')

  await issueParentSessionCookies(validated.parentId)
  return { parentId: validated.parentId }
}

/**
 * Question 2 of 2: MAY they touch this student?
 *
 * The authority is always the parent_students row — never a token claim, which
 * could outlive a revoked link.
 */
export const requireStudentAccess = async (
  studentId: string
): Promise<{ parentId: string; studentId: string }> => {
  const { parentId } = await requireParentSession()
  if (!(await canAccessStudent(parentId, studentId))) throw new Error('Forbidden')
  return { parentId, studentId }
}

/**
 * Resolves which student the parent is currently working with.
 *
 * The cookie is a preference; the link check is the authority. A cookie naming
 * a student the parent is no longer linked to falls back to their first student
 * rather than throwing, so an un-shared child does not brick the dashboard.
 */
export const resolveActiveStudent = async (): Promise<string> => {
  const { parentId } = await requireParentSession()
  const cookieStore = await cookies()
  const preferred = cookieStore.get(ACTIVE_STUDENT_COOKIE)?.value

  if (preferred && (await canAccessStudent(parentId, preferred))) return preferred

  const students = await listStudentsForParent(parentId)
  const first = students[0]
  if (!first) throw new Error('No students')
  return first.id
}

/**
 * The kid-side session. Scoped to one student and carrying no parent identity,
 * so a child cannot reach parent endpoints with it.
 */
export const requireKidSession = async (): Promise<{ studentId: string }> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(KID_SESSION_COOKIE)?.value
  if (!token) throw new Error('Unauthorized')

  const session = await verifyKidSessionToken(token)
  if (!session) throw new Error('Unauthorized')
  return { studentId: session.studentId }
}
