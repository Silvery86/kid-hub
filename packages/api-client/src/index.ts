// @kid-hub/api-client — transport-injected typed fetchers over /api/v1.
// Contract types come from @kid-hub/shared. Web injects fetch; Mobile injects
// its axios client. Auth (token storage) stays app-specific.

import type { SaveMathProgressInput, SaveEnglishProgressInput } from '@kid-hub/shared'
import type { HttpTransport } from './http'
import * as account from './endpoints/account'
import { getSchedule, getWeekSchedule } from './endpoints/schedule'
import { getTodayHomework, markHomeworkDone } from './endpoints/homework'
import { getGrades } from './endpoints/grades'
import { getKidProfile } from './endpoints/profile'
import { getProgress } from './endpoints/progress'
import { getKidPatternStatus, verifyKidPattern } from './endpoints/kid-pattern'
import * as parent from './endpoints/parent'
import { saveMathProgress, getMathBestScores } from './endpoints/math'
import { saveEnglishProgress, getEnglishBestScores } from './endpoints/english'

export * from './http'
export type { ParentAccount, StudentSummary } from './endpoints/account'

/**
 * Every call below concerns ONE student, so the id is bound once here instead of
 * threaded through each call site. Binding it makes the mistake this migration
 * is most likely to produce — reading one child's data while another is selected
 * — impossible to write: there is no way to reach these methods without having
 * named a student first.
 */
export const createStudentClient = (http: HttpTransport, studentId: string) => ({
  studentId,

  // ── Kid-facing ────────────────────────────────────────────────────────────
  getSchedule: () => getSchedule(http, studentId),
  getWeekSchedule: () => getWeekSchedule(http, studentId),
  getTodayHomework: () => getTodayHomework(http, studentId),
  markHomeworkDone: (periodId: string) => markHomeworkDone(http, studentId, periodId),
  getGrades: () => getGrades(http, studentId),
  getKidProfile: () => getKidProfile(http, studentId),
  getProgress: () => getProgress(http, studentId),
  saveMathProgress: (input: SaveMathProgressInput) => saveMathProgress(http, studentId, input),
  getMathBestScores: () => getMathBestScores(http, studentId),
  saveEnglishProgress: (input: SaveEnglishProgressInput) =>
    saveEnglishProgress(http, studentId, input),
  getEnglishBestScores: () => getEnglishBestScores(http, studentId),
  recordScreenTime: (seconds: number) => parent.recordScreenTime(http, studentId, seconds),

  // ── Kid unlock ────────────────────────────────────────────────────────────
  getKidPatternStatus: () => getKidPatternStatus(http, studentId),
  verifyKidPattern: (pattern: string) => verifyKidPattern(http, studentId, pattern),

  // ── Parent-only, still about this student ─────────────────────────────────
  getKidAccessSettings: () => parent.getKidAccessSettings(http, studentId),
  saveKidAccessSettings: (settings: Record<string, boolean>) =>
    parent.saveKidAccessSettings(http, studentId, settings),
  setKidPattern: (pattern: string) => parent.setKidPattern(http, studentId, pattern),
  getScreenTime: () => parent.getScreenTime(http, studentId),
  setScreenTimeLimit: (limitMins: number) =>
    parent.setScreenTimeLimit(http, studentId, limitMins),
  getRecentActivity: (limit?: number) => parent.getRecentActivity(http, studentId, limit),
  upsertGrade: (input: parent.UpsertGradeInput) => parent.upsertGrade(http, studentId, input),
  createPeriod: (input: unknown) => parent.createPeriod(http, studentId, input),
  updatePeriod: (id: string, input: unknown) => parent.updatePeriod(http, studentId, id, input),
  deletePeriod: (id: string) => parent.deletePeriod(http, studentId, id),
  createExtraClass: (input: unknown) => parent.createExtraClass(http, studentId, input),
  cancelExtraClass: (id: string, date: string, reason?: string) =>
    parent.cancelExtraClass(http, studentId, id, date, reason),
  restoreExtraClass: (id: string, date: string) =>
    parent.restoreExtraClass(http, studentId, id, date),
  addDailyHomework: (input: unknown) => parent.addDailyHomework(http, studentId, input),
  deleteDailyHomework: (id: string) => parent.deleteDailyHomework(http, studentId, id),
})

/**
 * Account-scoped calls — the signed-in parent, not any one student. `forStudent`
 * is the only door to the student-scoped surface.
 */
export const createApiClient = (http: HttpTransport) => ({
  register: (input: Parameters<typeof account.register>[1]) => account.register(http, input),
  getMe: () => account.getMe(http),
  listStudents: () => account.listStudents(http),
  createStudent: (input: { name: string; gradeLevel: number }) =>
    account.createStudent(http, input),
  verifyParentPin: (pin: string) => parent.verifyParentPin(http, pin),

  forStudent: (studentId: string) => createStudentClient(http, studentId),
})

export type ApiClient = ReturnType<typeof createApiClient>
export type StudentClient = ReturnType<typeof createStudentClient>
