import { ReportCardSchema, type ReportCard } from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const getGrades = async (http: HttpTransport): Promise<ReportCard> =>
  ReportCardSchema.parse(await http.get('/grades'))
