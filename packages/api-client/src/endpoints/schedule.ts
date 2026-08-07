import { TodayViewSchema, type TodayView } from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const getSchedule = async (http: HttpTransport): Promise<TodayView> =>
  TodayViewSchema.parse(await http.get('/schedule'))
