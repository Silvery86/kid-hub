/**
 * Owned by @kid-hub/shared (Phase 4 — MOBILE_UI_IMP.md §7) so the schedule and
 * dashboard screens compute identically on both platforms. Re-exported here so
 * existing web imports of `@/lib/schedule-display` keep working.
 */
export type { PeriodSlotLabel, WeekStats } from '@kid-hub/shared'
export {
  computeWeekStats,
  countSubjectDistribution,
  dayLabel,
  dayShortLabel,
  formatDayTimeRange,
  formatPeriodDuration,
  formatWeekSubtitleForOffset,
  getIsoWeekNumber,
  getMaxPeriodNumber,
  getMinutesLeftInPeriod,
  getMondayForWeekOffset,
  getPeriodForCell,
  getPeriodProgress,
  getPeriodSlotLabels,
  getTodayDDMM,
  getWeekDates,
  schoolDaysFromSchedule,
  schoolPeriodsOnly,
} from '@kid-hub/shared'
