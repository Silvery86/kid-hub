import { ProgressSummarySchema, type ProgressSummary } from '@kid-hub/shared'
import type { HttpTransport } from '../http'
import { studentPath } from './paths'

export const getProgress = async (
  http: HttpTransport,
  studentId: string
): Promise<ProgressSummary> =>
  ProgressSummarySchema.parse(await http.get(studentPath(studentId, '/progress')))
