// Server-only module — do NOT import from client components or hooks.
import 'server-only'

import type { SubjectGrade, ReportCard } from '@/types'
import { calculateBadge } from '@kid-hub/shared'
import * as gradesRepo from '@/server/repositories/grades.repository'
export type { GradeRecord } from '@/server/repositories/grades.repository'

// calculateBadge is owned by @kid-hub/shared (Phase 2); re-exported for callers
// that import it from this service (e.g. grades.actions.ts).
export { calculateBadge }

/** Compute the arithmetic average of all grades in a ReportCard. */
export const calculateAverage = (grades: SubjectGrade[]): number => {
  if (grades.length === 0) return 0
  const total = grades.reduce((sum, g) => sum + g.score, 0)
  return Math.round((total / grades.length) * 10) / 10 // 1 decimal place
}

/** Enrich an array of grades with their computed badge tiers. */
export const enrichWithBadges = (grades: Omit<SubjectGrade, 'badge'>[]): SubjectGrade[] =>
  grades.map((g) => ({ ...g, badge: calculateBadge(g.score) }))

/** Build a full ReportCard from raw grade data. */
export const buildReportCard = (studentId: string, grades: SubjectGrade[]): ReportCard => ({
  userId: studentId,
  grades,
  averageScore: calculateAverage(grades),
})

export const getReportCard = (studentId: string) => gradesRepo.getReportCard(studentId)

export const upsertGrade = (studentId: string, data: gradesRepo.GradeRecord): Promise<void> =>
  gradesRepo.upsertGrade(studentId, data)
