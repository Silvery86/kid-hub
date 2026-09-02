// parent.api.ts — the parent management surface (via @kid-hub/api-client).
// Every call here needs the parent Bearer token; the routes 401 without it.
import type {
  ActivityItem,
  KidAccessSettings,
  MutationAck,
  PinVerify,
  ScreenTime,
} from '@kid-hub/shared'

import { apiClient, studentApi } from './http'

export const verifyParentPin = async (pin: string): Promise<PinVerify> => apiClient.verifyParentPin(pin)

export const getKidAccessSettings = async (): Promise<KidAccessSettings> =>
  (await studentApi()).getKidAccessSettings()

export const saveKidAccessSettings = async (settings: Record<string, boolean>): Promise<MutationAck> =>
  (await studentApi()).saveKidAccessSettings(settings)

export const setKidPattern = async (pattern: string): Promise<MutationAck> =>
  (await studentApi()).setKidPattern(pattern)

export const getScreenTime = async (): Promise<ScreenTime> => (await studentApi()).getScreenTime()

export const setScreenTimeLimit = async (limitMins: number): Promise<MutationAck> =>
  (await studentApi()).setScreenTimeLimit(limitMins)

export const getRecentActivity = async (limit?: number): Promise<ActivityItem[]> =>
  (await studentApi()).getRecentActivity(limit)

export const upsertGrade = async (input: {
  subjectId: string
  score: number
  semester: 1 | 2
  academicYear: string
}): Promise<MutationAck> => (await studentApi()).upsertGrade(input)

export const createPeriod = async (input: unknown): Promise<MutationAck> => (await studentApi()).createPeriod(input)
export const updatePeriod = async (id: string, input: unknown): Promise<MutationAck> =>
  (await studentApi()).updatePeriod(id, input)
export const deletePeriod = async (id: string): Promise<MutationAck> => (await studentApi()).deletePeriod(id)
export const createExtraClass = async (input: unknown): Promise<MutationAck> =>
  (await studentApi()).createExtraClass(input)
export const addDailyHomework = async (input: unknown): Promise<MutationAck> =>
  (await studentApi()).addDailyHomework(input)
export const deleteDailyHomework = async (id: string): Promise<MutationAck> =>
  (await studentApi()).deleteDailyHomework(id)
