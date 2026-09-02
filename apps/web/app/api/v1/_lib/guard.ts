import { requireParentApi, requireStudentApi, requireStudentReadApi } from '@/server/lib/api-auth'

import { forbidden, unauthorized } from './respond'

/**
 * Route-layer wrappers that turn a guard's null into the right status code.
 *
 * The guards answer one bit — allowed or not — so telling 401 from 403 needs a
 * second question, asked only on the failure path: does this caller hold a valid
 * parent token at all? If yes they are authenticated but not entitled (403); if
 * no they never authenticated (401). The happy path still verifies once.
 *
 * Both return a Response to send, or null when the caller may proceed:
 *
 *   const denied = await guardStudent(req, studentId)
 *   if (denied) return denied
 */

/** Parent-only access to one student's data. */
export const guardStudent = async (
  req: Request,
  studentId: string
): Promise<Response | null> => {
  if (await requireStudentApi(req, studentId)) return null
  return (await requireParentApi(req)) ? forbidden() : unauthorized()
}

/** The kid-facing surface: a linked parent OR a kid session for this same student. */
export const guardStudentApp = async (
  req: Request,
  studentId: string
): Promise<Response | null> => {
  if (await requireStudentReadApi(req, studentId)) return null
  return (await requireParentApi(req)) ? forbidden() : unauthorized()
}
