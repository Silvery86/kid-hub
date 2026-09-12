/**
 * Custom subjects — the ones a parent added because their school teaches them.
 *
 * `studentId` is in every WHERE, including the ones that look like they are
 * keyed uniquely already: `subjectId` is unique per student, not globally, so
 * omitting the student would let one household's id address another's row.
 */

import { db } from '@/lib/db'
import type { CustomSubjectRow } from '@kid-hub/shared'

export interface CustomSubjectFields {
  name: string
  color: string
  icon: string
}

/** How many stored rows point at a subject. Zero on all three means safe to delete. */
export interface SubjectUsage {
  periods: number
  homework: number
  grades: number
}

const SELECT = { subjectId: true, name: true, color: true, icon: true } as const

export const listCustomSubjects = async (studentId: string): Promise<CustomSubjectRow[]> =>
  db.customSubject.findMany({
    where: { studentId },
    select: SELECT,
    orderBy: { createdAt: 'asc' },
  })

export const createCustomSubject = async (
  studentId: string,
  subjectId: string,
  fields: CustomSubjectFields
): Promise<CustomSubjectRow> =>
  db.customSubject.create({
    data: { studentId, subjectId, ...fields },
    select: SELECT,
  })

export const updateCustomSubject = async (
  studentId: string,
  subjectId: string,
  fields: CustomSubjectFields
): Promise<number> => {
  const { count } = await db.customSubject.updateMany({
    where: { studentId, subjectId },
    data: fields,
  })
  return count
}

export const deleteCustomSubject = async (
  studentId: string,
  subjectId: string
): Promise<number> => {
  const { count } = await db.customSubject.deleteMany({ where: { studentId, subjectId } })
  return count
}

/**
 * Counts everything that would be orphaned by deleting a subject.
 *
 * None of these three tables has a foreign key on `subjectId` — it is a bare
 * string in all of them — so the database will happily delete a subject out from
 * under a timetable. This count is the only thing standing in the way.
 */
export const countSubjectUsage = async (
  studentId: string,
  subjectId: string
): Promise<SubjectUsage> => {
  const [periods, homework, grades] = await Promise.all([
    db.classPeriod.count({ where: { studentId, subjectId } }),
    db.dailyHomework.count({ where: { studentId, subjectId } }),
    db.subjectGrade.count({ where: { studentId, subjectId } }),
  ])
  return { periods, homework, grades }
}
