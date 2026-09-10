import { TodayViewSchema, WeekViewSchema, type TodayView, type WeekView } from '@kid-hub/shared'
import type { HttpTransport } from '../http'
import { studentPath } from './paths'

export const getSchedule = async (
  http: HttpTransport,
  studentId: string
): Promise<TodayView> => TodayViewSchema.parse(await http.get(studentPath(studentId, '/schedule')))

/** `weekStartDate` must be a Monday; omit it for the current week. */
export const getWeekSchedule = async (
  http: HttpTransport,
  studentId: string,
  weekStartDate?: string
): Promise<WeekView> =>
  WeekViewSchema.parse(
    await http.get(
      studentPath(
        studentId,
        weekStartDate ? `/schedule/week?week=${weekStartDate}` : '/schedule/week'
      )
    )
  )
