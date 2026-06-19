'use server'

/**
 * Server Actions for subject grades: fetch report card and upsert individual grades.
 * All mutations are validated with Zod and guarded by parent session check.
 */

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireParentSession } from '@/server/lib/auth-guard'
import { calculateBadge } from '@/server/services/grades.service'
import * as gradesRepo from '@/server/repositories/grades.repository'
import * as userRepo from '@/server/repositories/user.repository'
import { buildReportCard } from '@/server/services/grades.service'
import type { ReportCard, ActionResult, ActionVoidResult } from '@/types'
import { DEFAULT_USER_ID } from '@/lib/constants'

const UpsertGradeSchema = z.object({
  subjectId: z.string().min(1),
  score: z.number().min(0).max(10),
  semester: z.union([z.literal(1), z.literal(2)]),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/),
})

/** Retrieves the full report card for the default user. */
export const getReportCardAction = async (): Promise<ActionResult<ReportCard>> => {
  try {
    const userId = DEFAULT_USER_ID
    const user = await userRepo.getUserById(userId)
    if (!user) return { success: true, data: { userId, grades: [], averageScore: 0 } }
    const grades = await gradesRepo.getReportCard(userId)
    return { success: true, data: buildReportCard(userId, grades) }
  } catch {
    return { success: false, error: 'Failed to fetch report card' }
  }
}

/** Creates or updates a subject grade entry. Revalidates grades and dashboard paths. */
export const upsertGradeAction = async (input: unknown): Promise<ActionVoidResult> => {
  try {
    await requireParentSession()
    const parsed = UpsertGradeSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const data = parsed.data
    const badge = calculateBadge(data.score)
    await gradesRepo.upsertGrade(DEFAULT_USER_ID, { ...data, badge })
    revalidatePath('/grades')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save grade'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}
