import type { HomeworkItem } from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const getTodayHomework = (http: HttpTransport): Promise<HomeworkItem[]> =>
  http.get<HomeworkItem[]>('/homework/today')

export const markHomeworkDone = (http: HttpTransport, periodId: string): Promise<void> =>
  http.post<void>(`/homework/${periodId}/done`)
