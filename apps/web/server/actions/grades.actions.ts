'use server'

/**
 * Server Actions for subject grades: fetch report card and upsert individual grades.
 * All mutations are validated with Zod and guarded by parent session check.
 */

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { resolveActiveStudent, resolveStudentContext } from '@/server/lib/auth-guard'
import { calculateBadge, buildReportCard, getReportCard, upsertGrade } from '@/server/services/grades.service'
import { getUserById } from '@/server/services/user.service'
import type { ReportCard, ActionResult, ActionVoidResult } from '@/types'

const UpsertGradeSchema = z.object({
  subjectId: z.string().min(1),
  score: z.number().min(0).max(10),
  semester: z.union([z.literal(1), z.literal(2)]),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/),
})

/** Retrieves the full report card for the student this request is about. */
export const getReportCardAction = async (): Promise<ActionResult<ReportCard>> => {
  try {
    const studentId = await resolveStudentContext()
    const student = await getUserById(studentId)
    if (!student) return { success: true, data: { studentId, grades: [], averageScore: 0 } }
    const grades = await getReportCard(studentId)
    return { success: true, data: buildReportCard(studentId, grades) }
  } catch {
    return { success: false, error: 'Failed to fetch report card' }
  }
}

/** Creates or updates a subject grade entry. Revalidates grades and dashboard paths. */
export const upsertGradeAction = async (input: unknown): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = UpsertGradeSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const data = parsed.data
    const badge = calculateBadge(data.score)
    await upsertGrade(studentId, { ...data, badge })
    revalidatePath('/grades')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save grade'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}
