import { HomeworkItemArraySchema, type HomeworkItem } from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const getTodayHomework = async (http: HttpTransport): Promise<HomeworkItem[]> =>
  HomeworkItemArraySchema.parse(await http.get('/homework/today'))

export const markHomeworkDone = (http: HttpTransport, periodId: string): Promise<void> =>
  http.post<void>(`/homework/${periodId}/done`)
