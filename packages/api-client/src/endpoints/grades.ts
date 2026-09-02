import { ReportCardSchema, type ReportCard } from '@kid-hub/shared'
import type { HttpTransport } from '../http'
import { studentPath } from './paths'

export const getGrades = async (
  http: HttpTransport,
  studentId: string
): Promise<ReportCard> => ReportCardSchema.parse(await http.get(studentPath(studentId, '/grades')))
