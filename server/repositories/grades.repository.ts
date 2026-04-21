/**
 * Server-only module — all Prisma queries for grade data live here.
 * No business logic in this layer — pure data access only.
 */

import { db } from '@/lib/db'
import type { BadgeTier } from '@/types'

export interface GradeRecord {
  subjectId: string
  score: number
  badge: BadgeTier
  semester: number
  academicYear: string
}

/** Fetches all subject grades for a user from the database. */
export const getReportCard = async (userId: string): Promise<GradeRecord[]> => {
  const rows = await db.subjectGrade.findMany({ where: { userId } })
  return rows.map((r) => ({
    subjectId: r.subjectId,
    score: r.score,
    badge: r.badge.replace('_', '-') as BadgeTier,
    semester: r.semester,
    academicYear: r.academicYear,
  }))
}

/** Creates or updates a single subject grade record for a user. */
export const upsertGrade = async (userId: string, data: GradeRecord): Promise<void> => {
  const badgeForDb = data.badge.replace('-', '_') as 'excellent' | 'good' | 'needs_practice'
  await db.subjectGrade.upsert({
    where: {
      userId_subjectId_semester_academicYear: {
        userId,
        subjectId: data.subjectId,
        semester: data.semester,
        academicYear: data.academicYear,
      },
    },
    create: {
      userId,
      subjectId: data.subjectId,
      score: data.score,
      badge: badgeForDb,
      semester: data.semester,
      academicYear: data.academicYear,
    },
    update: { score: data.score, badge: badgeForDb },
  })
}
