// parent.api.ts — the parent management surface (via @kid-hub/api-client).
// Every call here needs the parent Bearer token; the routes 401 without it.
import type {
  ActivityItem,
  KidAccessSettings,
  MutationAck,
  PinVerify,
  ScreenTime,
} from '@kid-hub/shared'

import { apiClient } from './http'

export const verifyParentPin = (pin: string): Promise<PinVerify> => apiClient.verifyParentPin(pin)

export const getKidAccessSettings = (): Promise<KidAccessSettings> =>
  apiClient.getKidAccessSettings()

export const saveKidAccessSettings = (settings: Record<string, boolean>): Promise<MutationAck> =>
  apiClient.saveKidAccessSettings(settings)

export const setKidPattern = (pattern: string): Promise<MutationAck> =>
  apiClient.setKidPattern(pattern)

export const getScreenTime = (): Promise<ScreenTime> => apiClient.getScreenTime()

export const setScreenTimeLimit = (limitMins: number): Promise<MutationAck> =>
  apiClient.setScreenTimeLimit(limitMins)

export const getRecentActivity = (limit?: number): Promise<ActivityItem[]> =>
  apiClient.getRecentActivity(limit)

export const upsertGrade = (input: {
  subjectId: string
  score: number
  semester: 1 | 2
  academicYear: string
}): Promise<MutationAck> => apiClient.upsertGrade(input)

export const createPeriod = (input: unknown): Promise<MutationAck> => apiClient.createPeriod(input)
export const updatePeriod = (id: string, input: unknown): Promise<MutationAck> =>
  apiClient.updatePeriod(id, input)
export const deletePeriod = (id: string): Promise<MutationAck> => apiClient.deletePeriod(id)
export const createExtraClass = (input: unknown): Promise<MutationAck> =>
  apiClient.createExtraClass(input)
export const addDailyHomework = (input: unknown): Promise<MutationAck> =>
  apiClient.addDailyHomework(input)
export const deleteDailyHomework = (id: string): Promise<MutationAck> =>
  apiClient.deleteDailyHomework(id)
