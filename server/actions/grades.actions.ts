'use server'

import { revalidatePath } from 'next/cache'
<<<<<<< HEAD
import { calculateBadge, fetchReportCard, saveGrade } from '@/server/services/grades.service'
import { checkAndAwardGradeBadges } from '@/server/services/rewards.service'
import { requireParentSession } from '@/server/lib/auth-guard'
import { UpsertGradeSchema } from '@/server/lib/schemas'
import type { ReportCard } from '@/types'
import { DEFAULT_USER_ID } from '@/lib/constants'

=======
import { requireParentSession } from '@/server/lib/auth-guard'
import { calculateBadge, buildReportCard, getReportCard, upsertGrade } from '@/server/services/grades.service'
import { getUserById } from '@/server/services/user.service'
import type { ReportCard, ActionResult, ActionVoidResult } from '@/types'
import { DEFAULT_USER_ID } from '@/lib/constants'

const UpsertGradeSchema = z.object({
  subjectId: z.string().min(1),
  score: z.number().min(0).max(10),
  semester: z.union([z.literal(1), z.literal(2)]),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/),
})

>>>>>>> main
/** Retrieves the full report card for the default user. */
export const getReportCardAction = async (): Promise<ActionResult<ReportCard>> => {
  try {
<<<<<<< HEAD
    return { success: true, data: await fetchReportCard(DEFAULT_USER_ID) }
=======
    const userId = DEFAULT_USER_ID
    const user = await getUserById(userId)
    if (!user) return { success: true, data: { userId, grades: [], averageScore: 0 } }
    const grades = await getReportCard(userId)
    return { success: true, data: buildReportCard(userId, grades) }
>>>>>>> main
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
<<<<<<< HEAD
    await saveGrade(DEFAULT_USER_ID, { ...data, badge })
    void checkAndAwardGradeBadges(DEFAULT_USER_ID, data.subjectId, data.score)
=======
    await upsertGrade(DEFAULT_USER_ID, { ...data, badge })
>>>>>>> main
    revalidatePath('/grades')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save grade'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}
