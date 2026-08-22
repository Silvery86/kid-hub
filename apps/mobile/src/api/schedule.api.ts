// schedule.api.ts — GET today's schedule view (via @kid-hub/api-client).
import type { TodayView, WeekView } from '@kid-hub/shared'

import { apiClient } from './http'

export const getSchedule = (): Promise<TodayView> => apiClient.getSchedule()

/** The whole timetable — the schedule screen's day tabs need more than today. */
export const getWeekSchedule = (): Promise<WeekView> => apiClient.getWeekSchedule()
