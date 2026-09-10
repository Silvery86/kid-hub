/**
 * Server-only module — all Prisma queries for school breaks live here.
 * No business logic in this layer — pure data access only.
 */

import { db } from '@/lib/db'
import type { SchoolBreak, SchoolBreakKind } from '@/types'
import type { HolidayPreset } from '@kid-hub/shared'

const toSchoolBreak = (row: {
  id: string
  kind: string
  label: string
  startDate: string
  endDate: string
  presetKey: string | null
  needsReview: boolean
  promotesToGrade: number | null
  promotedAt: Date | null
}): SchoolBreak => ({
  id: row.id,
  kind: row.kind as SchoolBreakKind,
  label: row.label,
  startDate: row.startDate,
  endDate: row.endDate,
  ...(row.presetKey ? { presetKey: row.presetKey } : {}),
  ...(row.needsReview ? { needsReview: true } : {}),
  ...(row.promotesToGrade != null ? { promotesToGrade: row.promotesToGrade } : {}),
  ...(row.promotedAt ? { promotedAt: row.promotedAt.toISOString() } : {}),
})

/** Every break for a student, earliest first. */
export const listSchoolBreaks = async (studentId: string): Promise<SchoolBreak[]> => {
  const rows = await db.schoolBreak.findMany({
    where: { studentId },
    orderBy: [{ startDate: 'asc' }],
  })
  return rows.map(toSchoolBreak)
}

export interface SaveSchoolBreakInput {
  id?: string
  kind: SchoolBreakKind
  label: string
  startDate: string
  endDate: string
  promotesToGrade?: number
}

/** Creates a parent-entered break. Returns the new id. */
export const createSchoolBreak = async (
  studentId: string,
  data: SaveSchoolBreakInput
): Promise<string> => {
  const row = await db.schoolBreak.create({
    data: {
      studentId,
      kind: data.kind,
      label: data.label,
      startDate: data.startDate,
      endDate: data.endDate,
      promotesToGrade: data.promotesToGrade ?? null,
    },
  })
  return row.id
}

/**
 * Updates a break the student owns.
 *
 * Editing a shipped holiday clears `needsReview`: the parent has now looked at
 * the date, which is exactly what the flag was asking for. `presetKey` is left
 * alone so a later re-seed still recognises the row and does not re-add it.
 */
export const updateSchoolBreak = async (
  studentId: string,
  data: SaveSchoolBreakInput & { id: string }
): Promise<void> => {
  await db.schoolBreak.updateMany({
    where: { id: data.id, studentId },
    data: {
      kind: data.kind,
      label: data.label,
      startDate: data.startDate,
      endDate: data.endDate,
      promotesToGrade: data.promotesToGrade ?? null,
      needsReview: false,
    },
  })
}

/**
 * Moves the child up, and records that it happened — in one transaction.
 *
 * The two writes belong together: a grade advanced without the mark would be
 * offered again tomorrow, and a mark without the grade would silently swallow
 * the promotion. Guarded on `promotedAt IS NULL` so a double submit — two tabs,
 * an impatient tap — advances the child once and no further.
 */
export const applyGradePromotion = async (
  studentId: string,
  breakId: string
): Promise<{ applied: boolean; gradeLevel?: number }> =>
  db.$transaction(async (tx) => {
    const brk = await tx.schoolBreak.findFirst({
      where: { id: breakId, studentId, kind: 'SUMMER_BREAK', promotedAt: null },
      select: { id: true, promotesToGrade: true },
    })
    if (!brk?.promotesToGrade) return { applied: false }

    const marked = await tx.schoolBreak.updateMany({
      where: { id: brk.id, studentId, promotedAt: null },
      data: { promotedAt: new Date() },
    })
    if (marked.count === 0) return { applied: false }

    await tx.student.update({
      where: { id: studentId },
      data: { gradeLevel: brk.promotesToGrade },
    })
    return { applied: true, gradeLevel: brk.promotesToGrade }
  })

/** Deletes a break the student owns. */
export const deleteSchoolBreak = async (id: string, studentId: string): Promise<void> => {
  await db.schoolBreak.deleteMany({ where: { id, studentId } })
}

/**
 * Adds any shipped holiday the student does not already have.
 *
 * `skipDuplicates` on the (studentId, presetKey) unique is what makes this safe
 * to run more than once: a parent who corrected the Tết dates keeps their
 * version, and a preset they deleted on purpose stays deleted only until the
 * next call — which is why this runs on request, never automatically.
 */
export const seedHolidayPresets = async (
  studentId: string,
  presets: HolidayPreset[]
): Promise<number> => {
  const result = await db.schoolBreak.createMany({
    data: presets.map((preset) => ({
      studentId,
      kind: preset.kind,
      label: preset.label,
      startDate: preset.startDate,
      endDate: preset.endDate,
      presetKey: preset.presetKey,
      needsReview: preset.needsReview ?? false,
    })),
    skipDuplicates: true,
  })
  return result.count
}
