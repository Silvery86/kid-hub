/** Pure helpers for kid-facing grades UI — semester grouping and summaries. */

import { SUBJECTS } from '@/lib/data/subjects'
import { calculateBadge } from '@/lib/utils'
import type { SubjectGrade, BadgeTier } from '@/types'

export interface DisplayGradeRow {
  subjectId: string
  score: number
  badge: BadgeTier
  hasData: boolean
}

export const gradesForSemester = (
  grades: SubjectGrade[],
  semester: 1 | 2
): DisplayGradeRow[] =>
  SUBJECTS.map((subject) => {
    const record = grades.find((g) => g.subjectId === subject.id && g.semester === semester)
    const score = record?.score ?? 0
    return {
      subjectId: subject.id,
      score,
      badge: record?.badge ?? calculateBadge(score),
      hasData: Boolean(record),
    }
  })

export const semesterAverage = (rows: DisplayGradeRow[]): number => {
  const withData = rows.filter((r) => r.hasData)
  if (withData.length === 0) return 0
  const total = withData.reduce((sum, r) => sum + r.score, 0)
  return Math.round((total / withData.length) * 10) / 10
}

export const topSubjectForSemester = (rows: DisplayGradeRow[]): string | null => {
  const ranked = rows.filter((r) => r.hasData).sort((a, b) => b.score - a.score)
  return ranked[0]?.subjectId ?? null
}
