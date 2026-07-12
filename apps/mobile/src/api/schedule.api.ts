// schedule.api.ts — GET today's schedule view (via @kid-hub/api-client).
import type { TodayView } from '@kid-hub/shared'

import { apiClient } from './http'

export const getSchedule = (): Promise<TodayView> => apiClient.getSchedule()
