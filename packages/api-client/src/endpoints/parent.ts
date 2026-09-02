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
import { studentPath } from './paths'

// ── Auth ─────────────────────────────────────────────────────────────────────

export const verifyParentPin = async (http: HttpTransport, pin: string): Promise<PinVerify> =>
  PinVerifySchema.parse(await http.post('/auth/pin', { pin }))

// ── Kid access ───────────────────────────────────────────────────────────────

export const getKidAccessSettings = async (
  http: HttpTransport,
  studentId: string
): Promise<KidAccessSettings> =>
  KidAccessSettingsSchema.parse(await http.get(studentPath(studentId, '/kid-access')))

export const saveKidAccessSettings = async (
  http: HttpTransport,
  studentId: string,
  settings: Record<string, boolean>
): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.put(studentPath(studentId, '/kid-access'), { settings }))

export const setKidPattern = async (
  http: HttpTransport,
  studentId: string,
  pattern: string
): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.put(studentPath(studentId, '/kid-access/pattern'), { pattern }))

// ── Screen time and activity ─────────────────────────────────────────────────

export const getScreenTime = async (
  http: HttpTransport,
  studentId: string
): Promise<ScreenTime> =>
  ScreenTimeSchema.parse(await http.get(studentPath(studentId, '/screen-time')))

export const setScreenTimeLimit = async (
  http: HttpTransport,
  studentId: string,
  limitMins: number
): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.put(studentPath(studentId, '/screen-time'), { limitMins }))

export const recordScreenTime = async (
  http: HttpTransport,
  studentId: string,
  seconds: number
): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.post(studentPath(studentId, '/screen-time'), { seconds }))

export const getRecentActivity = async (
  http: HttpTransport,
  studentId: string,
  limit?: number
): Promise<ActivityItem[]> =>
  ActivityItemArraySchema.parse(
    await http.get(studentPath(studentId, `/activity${limit ? `?limit=${limit}` : ''}`))
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
  studentId: string,
  input: UpsertGradeInput
): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.put(studentPath(studentId, '/grades'), input))

// ── Schedule writes ──────────────────────────────────────────────────────────

export const createPeriod = async (
  http: HttpTransport,
  studentId: string,
  input: unknown
): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.post(studentPath(studentId, '/schedule/periods'), input))

export const updatePeriod = async (
  http: HttpTransport,
  studentId: string,
  id: string,
  input: unknown
): Promise<MutationAck> =>
  MutationAckSchema.parse(
    await http.patch(studentPath(studentId, `/schedule/periods/${id}`), input)
  )

export const deletePeriod = async (
  http: HttpTransport,
  studentId: string,
  id: string
): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.delete(studentPath(studentId, `/schedule/periods/${id}`)))

export const createExtraClass = async (
  http: HttpTransport,
  studentId: string,
  input: unknown
): Promise<MutationAck> =>
  MutationAckSchema.parse(
    await http.post(studentPath(studentId, '/schedule/extra-classes'), input)
  )

export const cancelExtraClass = async (
  http: HttpTransport,
  studentId: string,
  id: string,
  date: string,
  reason?: string
): Promise<MutationAck> =>
  MutationAckSchema.parse(
    await http.post(studentPath(studentId, `/schedule/extra-classes/${id}/cancel`), {
      date,
      reason,
    })
  )

export const restoreExtraClass = async (
  http: HttpTransport,
  studentId: string,
  id: string,
  date: string
): Promise<MutationAck> =>
  MutationAckSchema.parse(
    await http.delete(studentPath(studentId, `/schedule/extra-classes/${id}/cancel?date=${date}`))
  )

export const addDailyHomework = async (
  http: HttpTransport,
  studentId: string,
  input: unknown
): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.post(studentPath(studentId, '/schedule/homework'), input))

export const deleteDailyHomework = async (
  http: HttpTransport,
  studentId: string,
  id: string
): Promise<MutationAck> =>
  MutationAckSchema.parse(await http.delete(studentPath(studentId, `/schedule/homework/${id}`)))
