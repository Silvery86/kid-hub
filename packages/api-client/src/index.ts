// @kid-hub/api-client — transport-injected typed fetchers over /api/v1.
// Contract types come from @kid-hub/shared. Web injects fetch; Mobile injects
// its axios client. Auth (token storage) and progress stay app-specific for now.

import type { SaveMathProgressInput, SaveEnglishProgressInput } from '@kid-hub/shared'
import type { HttpTransport } from './http'
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

/** Build a typed API client bound to a transport (fetch on web, axios on mobile). */
export const createApiClient = (http: HttpTransport) => ({
  getSchedule: () => getSchedule(http),
  getWeekSchedule: () => getWeekSchedule(http),
  getTodayHomework: () => getTodayHomework(http),
  markHomeworkDone: (periodId: string) => markHomeworkDone(http, periodId),
  getGrades: () => getGrades(http),
  getKidProfile: () => getKidProfile(http),
  getProgress: () => getProgress(http),
  getKidPatternStatus: () => getKidPatternStatus(http),
  verifyKidPattern: (pattern: string) => verifyKidPattern(http, pattern),

  // ── Parent surface — every one of these needs a parent Bearer token ────────
  verifyParentPin: (pin: string) => parent.verifyParentPin(http, pin),
  getKidAccessSettings: () => parent.getKidAccessSettings(http),
  saveKidAccessSettings: (settings: Record<string, boolean>) =>
    parent.saveKidAccessSettings(http, settings),
  setKidPattern: (pattern: string) => parent.setKidPattern(http, pattern),
  getScreenTime: () => parent.getScreenTime(http),
  setScreenTimeLimit: (limitMins: number) => parent.setScreenTimeLimit(http, limitMins),
  recordScreenTime: (seconds: number) => parent.recordScreenTime(http, seconds),
  getRecentActivity: (limit?: number) => parent.getRecentActivity(http, limit),
  upsertGrade: (input: parent.UpsertGradeInput) => parent.upsertGrade(http, input),
  createPeriod: (input: unknown) => parent.createPeriod(http, input),
  updatePeriod: (id: string, input: unknown) => parent.updatePeriod(http, id, input),
  deletePeriod: (id: string) => parent.deletePeriod(http, id),
  createExtraClass: (input: unknown) => parent.createExtraClass(http, input),
  cancelExtraClass: (id: string, date: string, reason?: string) =>
    parent.cancelExtraClass(http, id, date, reason),
  restoreExtraClass: (id: string, date: string) => parent.restoreExtraClass(http, id, date),
  addDailyHomework: (input: unknown) => parent.addDailyHomework(http, input),
  deleteDailyHomework: (id: string) => parent.deleteDailyHomework(http, id),
  saveMathProgress: (input: SaveMathProgressInput) => saveMathProgress(http, input),
  getMathBestScores: () => getMathBestScores(http),
  saveEnglishProgress: (input: SaveEnglishProgressInput) => saveEnglishProgress(http, input),
  getEnglishBestScores: () => getEnglishBestScores(http),
})

export type ApiClient = ReturnType<typeof createApiClient>
