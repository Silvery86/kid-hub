import type { ReportCard } from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const getGrades = (http: HttpTransport): Promise<ReportCard> =>
  http.get<ReportCard>('/grades')
