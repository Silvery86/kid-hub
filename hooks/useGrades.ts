'use client'

import { useMemo } from 'react'
import type { SubjectGrade, ReportCard } from '@/types'
import { SEED_GRADES } from '@/lib/data/grades'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/lib/constants'
import { calculateBadgeTier } from '@/lib/utils'

export interface UseGradesResult {
  reportCard: ReportCard
  setGrades: (grades: SubjectGrade[] | ((prev: SubjectGrade[]) => SubjectGrade[])) => void
}

/**
 * Reads grades from localStorage (falling back to seed data) and derives
 * badge tiers + average score. The parent can write new grades via setGrades.
 */
export const useGrades = (): UseGradesResult => {
  const [grades, setGrades] = useLocalStorage<SubjectGrade[]>(
    STORAGE_KEYS.GRADES,
    SEED_GRADES as SubjectGrade[]
  )

  const reportCard = useMemo<ReportCard>(() => {
    const withBadges: SubjectGrade[] = grades.map((g) => ({
      ...g,
      badge: calculateBadgeTier(g.score),
    }))
    const total = withBadges.reduce((sum, g) => sum + g.score, 0)
    const averageScore =
      withBadges.length > 0 ? Math.round((total / withBadges.length) * 10) / 10 : 0
    return { userId: 'khoi', grades: withBadges, averageScore }
  }, [grades])

  return { reportCard, setGrades }
}
