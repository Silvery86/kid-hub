// Pure schedule business rules — isomorphic. No Prisma, no server-only.
// Persistence stays in apps/web/server/services/schedule.service.ts, which
// re-exports these so existing web callers are unaffected.

import type { ClassPeriod, DailyHomework, TimeBand, TodayView } from '../types'
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
  homework: DailyHomework[]
): TodayView => ({
  date,
  schoolPeriods: [...schoolPeriods].sort(
    (a, b) => (a.periodNumber ?? 99) - (b.periodNumber ?? 99)
  ),
  eveningBlocks: filterCancelledSlots(eveningBlocks, cancelledIds),
  cancelledIds,
  homework,
})
