<<<<<<< HEAD
=======
// Server-only module — do NOT import from client components or hooks.
>>>>>>> main
import 'server-only'

import type { BadgeTier, SubjectGrade, ReportCard } from '@/types'
import { GRADE_SCALE } from '@/lib/constants'
import * as gradesRepo from '@/server/repositories/grades.repository'
<<<<<<< HEAD
import { getUserById } from '@/server/repositories/user.repository'
=======
export type { GradeRecord } from '@/server/repositories/grades.repository'
>>>>>>> main

/** Derive a BadgeTier from a numeric score (0–10). */
export const calculateBadge = (score: number): BadgeTier => {
  if (score >= GRADE_SCALE.EXCELLENT) return 'excellent'
  if (score >= GRADE_SCALE.GOOD) return 'good'
  return 'needs-practice'
}

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
export const buildReportCard = (userId: string, grades: SubjectGrade[]): ReportCard => ({
  userId,
  grades,
  averageScore: calculateAverage(grades),
})

<<<<<<< HEAD
/** Fetches the full report card for a user; returns empty card if user doesn't exist. */
export const fetchReportCard = async (userId: string): Promise<ReportCard> => {
  const user = await getUserById(userId)
  if (!user) return { userId, grades: [], averageScore: 0 }
  const grades = await gradesRepo.getReportCard(userId)
  return buildReportCard(userId, grades)
}

/** Creates or updates a single subject grade record. */
export const saveGrade = async (
  userId: string,
  data: { subjectId: string; score: number; semester: 1 | 2; academicYear: string; badge: BadgeTier }
): Promise<void> => gradesRepo.upsertGrade(userId, data)
=======
export const getReportCard = (userId: string) => gradesRepo.getReportCard(userId)

export const upsertGrade = (userId: string, data: gradesRepo.GradeRecord): Promise<void> =>
  gradesRepo.upsertGrade(userId, data)
>>>>>>> main
