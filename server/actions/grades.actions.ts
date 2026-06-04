'use server'

import { revalidatePath } from 'next/cache'
import { calculateBadge, fetchReportCard, saveGrade } from '@/server/services/grades.service'
import { checkAndAwardGradeBadges } from '@/server/services/rewards.service'
import { requireParentSession } from '@/server/lib/auth-guard'
import { UpsertGradeSchema } from '@/server/lib/schemas'
import type { ReportCard } from '@/types'
import { DEFAULT_USER_ID } from '@/lib/constants'

/** Retrieves the full report card for the default user. */
export const getReportCardAction = async (): Promise<{
  success: boolean
  data?: ReportCard
  error?: string
}> => {
  try {
    return { success: true, data: await fetchReportCard(DEFAULT_USER_ID) }
  } catch {
    return { success: false, error: 'Failed to fetch report card' }
  }
}

/** Creates or updates a subject grade entry. Revalidates grades and dashboard paths. */
export const upsertGradeAction = async (
  input: unknown
): Promise<{ success: boolean; error?: string }> => {
  try {
    await requireParentSession()
    const parsed = UpsertGradeSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const data = parsed.data
    const badge = calculateBadge(data.score)
    await saveGrade(DEFAULT_USER_ID, { ...data, badge })
    void checkAndAwardGradeBadges(DEFAULT_USER_ID, data.subjectId, data.score)
    revalidatePath('/grades')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save grade'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}
