// Parent-surface fetchers. Every one of these needs a parent Bearer token;
// the routes reject anything else with a 401.
import {
  ActivityItemArraySchema,
  KidAccessSettingsSchema,
  MutationAckSchema,
  PinVerifySchema,
  ScreenTimeSchema,
  type ActivityItem,
  type KidAccessSettings,
  type MutationAck,
  type PinVerify,
  type ScreenTime,
} from '@kid-hub/shared'
import type { HttpTransport } from '../http'

// ── Auth ─────────────────────────────────────────────────────────────────────

export const verifyParentPin = async (http: HttpTransport, pin: string): Promise<PinVerify> =>
  PinVerifySchema.parse(await http.post('/auth/pin', { pin }))

// ── Kid access ───────────────────────────────────────────────────────────────

export const getKidAccessSettings = async (http: HttpTransport): Promise<KidAccessSettings> =>
  KidAccessSettingsSchema.parse(await http.get('/kid-access'))

export const saveKidAccessSettings = async (
  http: HttpTransport,
  settings: Record<string, boolean>
): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.put('/kid-access', { settings }))

export const setKidPattern = async (http: HttpTransport, pattern: string): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.put('/kid-access/pattern', { pattern }))

// ── Screen time and activity ─────────────────────────────────────────────────

export const getScreenTime = async (http: HttpTransport): Promise<ScreenTime> =>
  ScreenTimeSchema.parse(await http.get('/screen-time'))

export const setScreenTimeLimit = async (
  http: HttpTransport,
  limitMins: number
): Promise<MutationAck> => MutationAckSchema.parse(await http.put('/screen-time', { limitMins }))

export const recordScreenTime = async (
  http: HttpTransport,
  seconds: number
): Promise<MutationAck> => MutationAckSchema.parse(await http.post('/screen-time', { seconds }))

export const getRecentActivity = async (
  http: HttpTransport,
  limit?: number
): Promise<ActivityItem[]> =>
  ActivityItemArraySchema.parse(
    await http.get(`/activity${limit ? `?limit=${limit}` : ''}`)
  )

// ── Grades ───────────────────────────────────────────────────────────────────

export interface UpsertGradeInput {
  subjectId: string
  score: number
  semester: 1 | 2
  academicYear: string
}

export const upsertGrade = async (
  http: HttpTransport,
  input: UpsertGradeInput
): Promise<MutationAck> => MutationAckSchema.parse(await http.put('/grades', input))

// ── Schedule writes ──────────────────────────────────────────────────────────

export const createPeriod = async (http: HttpTransport, input: unknown): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.post('/schedule/periods', input))

export const updatePeriod = async (
  http: HttpTransport,
  id: string,
  input: unknown
): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.patch(`/schedule/periods/${id}`, input))

export const deletePeriod = async (http: HttpTransport, id: string): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.delete(`/schedule/periods/${id}`))

export const createExtraClass = async (http: HttpTransport, input: unknown): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.post('/schedule/extra-classes', input))

export const cancelExtraClass = async (
  http: HttpTransport,
  id: string,
  date: string,
  reason?: string
): Promise<MutationAck> =>
  MutationAckSchema.parse(
    await http.post(`/schedule/extra-classes/${id}/cancel`, { date, reason })
  )

export const restoreExtraClass = async (
  http: HttpTransport,
  id: string,
  date: string
): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.delete(`/schedule/extra-classes/${id}/cancel?date=${date}`))

export const addDailyHomework = async (http: HttpTransport, input: unknown): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.post('/schedule/homework', input))

export const deleteDailyHomework = async (http: HttpTransport, id: string): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.delete(`/schedule/homework/${id}`))
