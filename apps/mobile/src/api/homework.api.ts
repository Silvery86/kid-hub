// homework.api.ts — GET today's homework, POST mark-done (via @kid-hub/api-client).
import type { HomeworkItem } from '@kid-hub/shared'

import { apiClient } from './http'

export const getTodayHomework = (): Promise<HomeworkItem[]> => apiClient.getTodayHomework()

export const markHomeworkDone = (periodId: string): Promise<void> =>
  apiClient.markHomeworkDone(periodId)
