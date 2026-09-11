import { MIDDAY_BREAK_LABEL, type BellRules, type BellSlot, type DayOfWeek } from '@kid-hub/shared'

import { db } from '@/lib/db'

/** The stored rules plus the timeline they produced. */
export interface StoredBellSchedule {
  id: string
  presetKey?: string
  rules: BellRules
  slots: BellSlot[]
}

type SlotRow = {
  id: string
  kind: 'PERIOD' | 'BREAK' | 'ROUTINE'
  periodNumber: number | null
  label: string | null
  startTime: string
  endTime: string
  days: string[]
  isGenerated: boolean
}

const toSlot = (row: SlotRow): BellSlot => ({
  id: row.id,
  kind: row.kind,
  ...(row.periodNumber != null ? { periodNumber: row.periodNumber } : {}),
  ...(row.label ? { label: row.label } : {}),
  startTime: row.startTime,
  endTime: row.endTime,
  days: row.days as DayOfWeek[],
  isGenerated: row.isGenerated,
})

/**
 * Rebuilds the rule object from the flat columns. Routines are deliberately not
 * stored as rules — nothing derives them, so they live only as ROUTINE slots and
 * are read back from there.
 *
 * The one ROUTINE slot that IS derived — the midday break, which follows from
 * `boarding` — is excluded by the caller, or it would return as an explicit
 * routine and be generated twice.
 */
const toRules = (row: {
  periodMinutes: number
  transitionMinutes: number
  morningStart: string
  morningPeriods: number
  morningRecessAfter: number | null
  morningRecessStart: string | null
  morningRecessMinutes: number | null
  afternoonStart: string | null
  afternoonPeriods: number
  afternoonRecessAfter: number | null
  afternoonRecessStart: string | null
  afternoonRecessMinutes: number | null
  boarding: boolean
}, routines: BellSlot[]): BellRules => ({
  periodMinutes: row.periodMinutes,
  transitionMinutes: row.transitionMinutes,
  morning: {
    start: row.morningStart,
    periods: row.morningPeriods,
    ...(row.morningRecessAfter != null && row.morningRecessStart && row.morningRecessMinutes != null
      ? {
          recess: {
            afterPeriod: row.morningRecessAfter,
            start: row.morningRecessStart,
            minutes: row.morningRecessMinutes,
          },
        }
      : {}),
  },
  ...(row.afternoonStart
    ? {
        afternoon: {
          start: row.afternoonStart,
          periods: row.afternoonPeriods,
          ...(row.afternoonRecessAfter != null &&
          row.afternoonRecessStart &&
          row.afternoonRecessMinutes != null
            ? {
                recess: {
                  afterPeriod: row.afternoonRecessAfter,
                  start: row.afternoonRecessStart,
                  minutes: row.afternoonRecessMinutes,
                },
              }
            : {}),
        },
      }
    : {}),
  boarding: row.boarding,
  routines: routines.map((r) => ({
    label: r.label ?? '',
    startTime: r.startTime,
    endTime: r.endTime,
    days: r.days,
  })),
})

export const getBellSchedule = async (studentId: string): Promise<StoredBellSchedule | null> => {
  const row = await db.bellSchedule.findUnique({
    where: { studentId },
    include: { slots: { orderBy: { startTime: 'asc' } } },
  })
  if (!row) return null

  const slots = row.slots.map(toSlot)
  return {
    id: row.id,
    ...(row.presetKey ? { presetKey: row.presetKey } : {}),
    rules: toRules(
      row,
      slots.filter((s) => s.kind === 'ROUTINE' && s.label !== MIDDAY_BREAK_LABEL)
    ),
    slots,
  }
}

/**
 * Writes the rules and replaces the timeline in one transaction.
 *
 * Slots the parent has hand-edited (`isGenerated: false`) are preserved: a
 * corrected slot must survive the parent later changing an unrelated rule and
 * regenerating, or the correction silently disappears.
 */
export const saveBellSchedule = async (
  studentId: string,
  rules: BellRules,
  slots: BellSlot[],
  presetKey?: string
): Promise<void> => {
  const flat = {
    presetKey: presetKey ?? null,
    periodMinutes: rules.periodMinutes,
    transitionMinutes: rules.transitionMinutes,
    morningStart: rules.morning.start,
    morningPeriods: rules.morning.periods,
    morningRecessAfter: rules.morning.recess?.afterPeriod ?? null,
    morningRecessStart: rules.morning.recess?.start ?? null,
    morningRecessMinutes: rules.morning.recess?.minutes ?? null,
    afternoonStart: rules.afternoon?.start ?? null,
    afternoonPeriods: rules.afternoon?.periods ?? 0,
    afternoonRecessAfter: rules.afternoon?.recess?.afterPeriod ?? null,
    afternoonRecessStart: rules.afternoon?.recess?.start ?? null,
    afternoonRecessMinutes: rules.afternoon?.recess?.minutes ?? null,
    boarding: rules.boarding,
  }

  await db.$transaction(async (tx) => {
    const schedule = await tx.bellSchedule.upsert({
      where: { studentId },
      create: { studentId, ...flat },
      update: flat,
    })

    // Hand-edited slots are kept; everything generated is rebuilt from the rules.
    await tx.bellSlot.deleteMany({ where: { scheduleId: schedule.id, isGenerated: true } })

    if (slots.length > 0) {
      await tx.bellSlot.createMany({
        data: slots.map((s) => ({
          scheduleId: schedule.id,
          kind: s.kind,
          periodNumber: s.periodNumber ?? null,
          label: s.label ?? null,
          startTime: s.startTime,
          endTime: s.endTime,
          days: s.days,
          isGenerated: s.isGenerated,
        })),
      })
    }
  })
}

export const deleteBellSchedule = async (studentId: string): Promise<void> => {
  await db.bellSchedule.deleteMany({ where: { studentId } })
}
