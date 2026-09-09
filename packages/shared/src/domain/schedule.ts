// Pure schedule business rules — isomorphic. No Prisma, no server-only.
// Persistence stays in apps/web/server/services/schedule.service.ts, which
// re-exports these so existing web callers are unaffected.

import type {
  BellSlot,
  ClassPeriod,
  DailyHomework,
  DailySchedule,
  DayOfWeek,
  TimeBand,
  TodayView,
} from '../types'
import { parseTimeToMinutes } from './time'

/**
 * Returns true if the proposed period overlaps any existing period on the same day.
 * Overlap: newStart < existingEnd AND newEnd > existingStart.
 * Skips entries without a periodNumber (extra class blocks use startTime comparison instead).
 */
export const validatePeriodOverlap = (proposed: ClassPeriod, existing: ClassPeriod[]): boolean =>
  existing.some(
    (p) =>
      (p.periodNumber == null || p.periodNumber !== proposed.periodNumber) &&
      proposed.startTime < p.endTime &&
      proposed.endTime > p.startTime
  )

/** Derives the time band ("morning" | "afternoon" | "evening") from an "HH:MM" string. */
export const deriveTimeBand = (startTime: string): TimeBand => {
  const minutes = parseTimeToMinutes(startTime)
  if (minutes < 12 * 60) return 'morning'
  if (minutes < 17 * 60) return 'afternoon'
  return 'evening'
}

/** Removes extra class entries whose periodId appears in the cancelled set. */
export const filterCancelledSlots = (
  blocks: ClassPeriod[],
  cancelledIds: string[]
): ClassPeriod[] => {
  if (cancelledIds.length === 0) return blocks
  const cancelled = new Set(cancelledIds)
  return blocks.filter((b) => !b.id || !cancelled.has(b.id))
}

/**
 * Merges school periods, evening blocks, overrides, and daily homework into a single
 * TodayView for the kid schedule page.
 */
export const buildTodayView = (
  date: string,
  schoolPeriods: ClassPeriod[],
  eveningBlocks: ClassPeriod[],
  cancelledIds: string[],
  homework: DailyHomework[],
  bellSlots?: BellSlot[]
): TodayView => ({
  date,
  schoolPeriods: [...schoolPeriods].sort(
    (a, b) => (a.periodNumber ?? 99) - (b.periodNumber ?? 99)
  ),
  eveningBlocks: filterCancelledSlots(eveningBlocks, cancelledIds),
  cancelledIds,
  homework,
  ...(bellSlots && bellSlots.length > 0 ? { bellSlots } : {}),
})

// ── Week-at-a-time editing ───────────────────────────────────

/** One filled cell of the week grid: which subject sits at this day + tiết. */
export interface WeekCell {
  day: DayOfWeek
  periodNumber: number
  subjectId: string
  /** Lesson variant as the timetable prints it — "Học vần", "Tập viết". */
  note?: string
}

/** What a week save has to do to the stored rows to become the grid on screen. */
export interface WeekDiff {
  created: WeekCell[]
  updated: (WeekCell & { id: string })[]
  /** Row ids to delete — cells the parent emptied. */
  deleted: string[]
}

const cellKey = (day: DayOfWeek, periodNumber: number): string => `${day}-${periodNumber}`

/**
 * Works out the minimum set of writes that turns the stored week into the one
 * the parent has on screen.
 *
 * Cells are matched on (day, periodNumber) — the same pair the unique
 * constraint uses — so a subject swapped into an occupied slot is an UPDATE
 * rather than a delete plus an insert that would collide with itself.
 *
 * Only numbered SCHOOL_PERIOD rows take part. Extra classes carry no
 * periodNumber and belong to a different surface; touching them here would
 * silently delete a parent's evening classes.
 */
export const diffWeek = (current: DailySchedule[], next: WeekCell[]): WeekDiff => {
  const stored = new Map<string, ClassPeriod & { day: DayOfWeek }>()
  for (const daySchedule of current) {
    for (const period of daySchedule.periods) {
      if (period.periodNumber == null) continue
      if (period.eventType != null && period.eventType !== 'SCHOOL_PERIOD') continue
      stored.set(cellKey(daySchedule.day, period.periodNumber), {
        ...period,
        day: daySchedule.day,
      })
    }
  }

  const diff: WeekDiff = { created: [], updated: [], deleted: [] }
  const seen = new Set<string>()

  for (const cell of next) {
    const key = cellKey(cell.day, cell.periodNumber)
    seen.add(key)
    const existing = stored.get(key)

    if (!existing?.id) {
      diff.created.push(cell)
      continue
    }
    // An unchanged cell is not a write. A 35-cell grid where one subject moved
    // should be one UPDATE, not 35.
    const sameSubject = existing.subjectId === cell.subjectId
    const sameNote = (existing.note ?? '') === (cell.note ?? '')
    if (!sameSubject || !sameNote) {
      diff.updated.push({ ...cell, id: existing.id })
    }
  }

  for (const [key, period] of stored) {
    if (!seen.has(key) && period.id) diff.deleted.push(period.id)
  }

  return diff
}
