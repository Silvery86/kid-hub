import 'server-only'

/**
 * Rules for a household's own subjects.
 *
 * The programme's subjects are fixed in code and never reach this file: they
 * cannot be renamed, hidden or deleted (docs/SCHEDULE_SUBJECT.md S1–S3). What
 * lives here is everything a parent may add on top, and the one rule that keeps
 * the data honest — a subject in use cannot be deleted (S6).
 */

import { randomUUID } from 'node:crypto'

import type { CustomSubjectRow } from '@kid-hub/shared'
import * as subjectRepo from '@/server/repositories/subject.repository'
import type { CustomSubjectFields, SubjectUsage } from '@/server/repositories/subject.repository'

export type { SubjectUsage }

/** Fits VARCHAR(30): "custom_" is 7 characters, leaving room for 20 and a margin. */
const newSubjectId = (): string => `custom_${randomUUID().replace(/-/g, '').slice(0, 20)}`

export const list = (studentId: string): Promise<CustomSubjectRow[]> =>
  subjectRepo.listCustomSubjects(studentId)

export const usageOf = (studentId: string, subjectId: string): Promise<SubjectUsage> =>
  subjectRepo.countSubjectUsage(studentId, subjectId)

export const isInUse = (usage: SubjectUsage): boolean =>
  usage.periods + usage.homework + usage.grades > 0

export const add = (
  studentId: string,
  fields: CustomSubjectFields
): Promise<CustomSubjectRow> =>
  subjectRepo.createCustomSubject(studentId, newSubjectId(), fields)

/** Returns false when the id names no subject of this student's. */
export const update = async (
  studentId: string,
  subjectId: string,
  fields: CustomSubjectFields
): Promise<boolean> => (await subjectRepo.updateCustomSubject(studentId, subjectId, fields)) > 0

/**
 * Deletes only a subject nothing points at.
 *
 * The caller is expected to have checked `usageOf` already so the UI can explain
 * itself; this second check is not redundant. A lesson can be scheduled in
 * another tab between the check and the click, and the three tables involved
 * have no foreign key that would notice.
 */
export const remove = async (
  studentId: string,
  subjectId: string
): Promise<{ deleted: boolean; usage: SubjectUsage }> => {
  const usage = await usageOf(studentId, subjectId)
  if (isInUse(usage)) return { deleted: false, usage }

  const count = await subjectRepo.deleteCustomSubject(studentId, subjectId)
  return { deleted: count > 0, usage }
}
