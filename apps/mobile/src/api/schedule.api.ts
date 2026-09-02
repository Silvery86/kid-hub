// schedule.api.ts — GET today's schedule view (via @kid-hub/api-client).
import type { TodayView, WeekView } from '@kid-hub/shared'

import { studentApi } from './http'

export const getSchedule = async (): Promise<TodayView> => (await studentApi()).getSchedule()

/** The whole timetable — the schedule screen's day tabs need more than today. */
export const getWeekSchedule = async (): Promise<WeekView> => (await studentApi()).getWeekSchedule()
