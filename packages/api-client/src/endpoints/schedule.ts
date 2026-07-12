import type { TodayView } from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const getSchedule = (http: HttpTransport): Promise<TodayView> =>
  http.get<TodayView>('/schedule')
