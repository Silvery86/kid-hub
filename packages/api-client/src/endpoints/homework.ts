import { HomeworkItemArraySchema, type HomeworkItem } from '@kid-hub/shared'
import type { HttpTransport } from '../http'
import { studentPath } from './paths'

export const getTodayHomework = async (
  http: HttpTransport,
  studentId: string
): Promise<HomeworkItem[]> =>
  HomeworkItemArraySchema.parse(await http.get(studentPath(studentId, '/homework/today')))

export const markHomeworkDone = (
  http: HttpTransport,
  studentId: string,
  periodId: string
): Promise<void> => http.post<void>(studentPath(studentId, `/homework/${periodId}/done`))
