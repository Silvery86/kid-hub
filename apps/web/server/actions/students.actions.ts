'use server'

/**
 * The parent's own students: listing them, adding one, and choosing which one
 * the parent is currently looking at.
 *
 * Business rules live in auth.service; this layer validates input, guards, and
 * writes the active-student cookie.
 */

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { StudentIntakeSchema } from '@kid-hub/shared'
import { z } from 'zod'
import { ACTIVE_STUDENT_COOKIE } from '@/lib/constants'
import { requireParentSession, requireStudentAccess, resolveActiveStudent } from '@/server/lib/auth-guard'
import { createStudent, isAdmin, listStudentsForParent } from '@/server/services/auth.service'
import { getUserById } from '@/server/services/user.service'
import type { ActionResult, ActionVoidResult } from '@/types'

export interface StudentSummary {
  id: string
  name: string
  gradeLevel: number
  avatarUrl: string | null
  role: 'OWNER' | 'GUARDIAN'
}

/**
 * What the parent shell needs to render itself: whose data is on screen, and
 * whether to offer the admin surface. Hard-coding the name was fine with one
 * child and mislabels every other one.
 */
export const getParentContextAction = async (): Promise<{
  studentName: string
  isAdmin: boolean
}> => {
  try {
    const { parentId } = await requireParentSession()
    const [admin, studentId] = await Promise.all([
      isAdmin(parentId),
      resolveActiveStudent().catch(() => null),
    ])
    const student = studentId ? await getUserById(studentId) : null
    return { studentName: student?.name ?? 'bé', isAdmin: admin }
  } catch {
    return { studentName: 'bé', isAdmin: false }
  }
}

// Same definition the signup form validates against, so "what the server will
// accept" has exactly one answer.
const CreateStudentSchema = StudentIntakeSchema

/** The students this parent may act for, plus which one is active. */
export const listStudentsAction = async (): Promise<
  ActionResult<{ students: StudentSummary[]; activeStudentId: string | null }>
> => {
  try {
    const { parentId } = await requireParentSession()
    const students = (await listStudentsForParent(parentId)) as StudentSummary[]
    // A parent with no students yet must still get a list, not an error.
    const activeStudentId = students.length > 0 ? await resolveActiveStudent() : null
    return { success: true, data: { students, activeStudentId } }
  } catch {
    return { success: false, error: 'Không tải được danh sách bé' }
  }
}

/** Adds a student to this parent's household, linked as OWNER. */
export const createStudentAction = async (input: unknown): Promise<ActionVoidResult> => {
  const parsed = CreateStudentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }
  }

  try {
    const { parentId } = await requireParentSession()
    await createStudent(parentId, parsed.data.name, parsed.data.gradeLevel)
    revalidatePath('/parent/students')
    revalidatePath('/parent')
    return { success: true }
  } catch {
    return { success: false, error: 'Không thêm được bé' }
  }
}

/**
 * Switches which student the parent is looking at.
 *
 * The link is re-checked before the cookie is written: the cookie is a
 * preference and must never be able to name a student the parent cannot reach.
 */
export const setActiveStudentAction = async (studentId: string): Promise<ActionVoidResult> => {
  const parsed = z.string().min(1).safeParse(studentId)
  if (!parsed.success) return { success: false, error: 'Bé không hợp lệ' }

  try {
    await requireStudentAccess(parsed.data)
    const cookieStore = await cookies()
    cookieStore.set(ACTIVE_STUDENT_COOKIE, parsed.data, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    revalidatePath('/parent')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'Forbidden') return { success: false, error: 'Bạn không có quyền với bé này' }
    return { success: false, error: 'Không đổi được bé' }
  }
}
