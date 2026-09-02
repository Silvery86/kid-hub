import { TodayViewSchema, WeekViewSchema, type TodayView, type WeekView } from '@kid-hub/shared'
import type { HttpTransport } from '../http'
import { studentPath } from './paths'

export const getSchedule = async (
  http: HttpTransport,
  studentId: string
): Promise<TodayView> => TodayViewSchema.parse(await http.get(studentPath(studentId, '/schedule')))

export const getWeekSchedule = async (
  http: HttpTransport,
  studentId: string
): Promise<WeekView> =>
  WeekViewSchema.parse(await http.get(studentPath(studentId, '/schedule/week')))
