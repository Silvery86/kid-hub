// homework.api.ts — GET today's homework, POST mark-done (via @kid-hub/api-client).
import type { HomeworkItem } from '@kid-hub/shared'

import { studentApi } from './http'

export const getTodayHomework = async (): Promise<HomeworkItem[]> => (await studentApi()).getTodayHomework()

export const markHomeworkDone = async (periodId: string): Promise<void> =>
  (await studentApi()).markHomeworkDone(periodId)
