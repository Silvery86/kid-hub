import { ProgressSummarySchema, type ProgressSummary } from '@kid-hub/shared'
import type { HttpTransport } from '../http'

export const getProgress = async (http: HttpTransport): Promise<ProgressSummary> =>
  ProgressSummarySchema.parse(await http.get('/progress'))
