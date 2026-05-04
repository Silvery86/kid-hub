import 'server-only'

import type { DayOfWeek } from '@/types'

/** Returns today's date as "YYYY-MM-DD" — used as the daily key for HomeworkCompletion records. */
export const todayDateKey = (): string => new Date().toISOString().split('T')[0]!

/** Returns today's DayOfWeek, or null on weekends. */
export const todayDayOfWeek = (): DayOfWeek | null => {
  const map: Array<DayOfWeek | null> = [
    null,
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    null,
  ]
  return map[new Date().getDay()] ?? null
}
