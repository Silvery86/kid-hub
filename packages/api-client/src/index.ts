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
  saveMathProgress: (input: SaveMathProgressInput) => saveMathProgress(http, input),
  getMathBestScores: () => getMathBestScores(http),
  saveEnglishProgress: (input: SaveEnglishProgressInput) => saveEnglishProgress(http, input),
  getEnglishBestScores: () => getEnglishBestScores(http),
})

export type ApiClient = ReturnType<typeof createApiClient>
