import { TodayViewSchema, WeekViewSchema, type TodayView, type WeekView } from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const getSchedule = async (http: HttpTransport): Promise<TodayView> =>
  TodayViewSchema.parse(await http.get('/schedule'))

export const getWeekSchedule = async (http: HttpTransport): Promise<WeekView> =>
  WeekViewSchema.parse(await http.get('/schedule/week'))
