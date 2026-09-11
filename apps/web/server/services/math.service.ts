/**
 * Business logic for the math mini-game module.
 * Handles score calculation, best score updates, points award, and homework linkage.
 */

import 'server-only'

import * as mathRepo from '@/server/repositories/math.repository'
import * as homeworkRepo from '@/server/repositories/homework.repository'
import { calculateStars, calculatePointsEarned } from '@kid-hub/shared'
import { checkAndAwardGameWinBadge } from '@/server/services/rewards.service'
import { GAME_QUESTIONS_PER_SESSION } from '@/lib/constants'
import type { SaveMathProgressInput } from '@/types'

export interface MathSessionResult {
  starsEarned: 1 | 2 | 3
  score: number
  pointsEarned: number
  isNewBest: boolean
  /**
   * Badges earned by *this* session, for the result screen to celebrate.
   * Empty on every session that earns nothing, which is most of them.
   */
  newBadgeIds: string[]
}

/**
 * Persists a completed math session:
 *  1. Calculates stars and derived score.
 *  2. Compares against current best — updates only if improved.
 *  3. Awards points to user progress.
 *  4. If a homeworkPeriodId is provided, marks that period done for the given date.
 */
export const saveMathSession = async (
  studentId: string,
  input: SaveMathProgressInput
): Promise<MathSessionResult> => {
  const stars = calculateStars(input.correctCount, GAME_QUESTIONS_PER_SESSION)
  const score = input.correctCount * 10
  const pointsEarned = calculatePointsEarned(input.correctCount, stars)

  const existing = await mathRepo.getMathBestScore(studentId, input.minigame, input.level)
  const isNewBest = !existing || stars > existing.starsEarned

  await mathRepo.saveMathProgress({
    studentId,
    minigame: input.minigame,
    level: input.level,
    correctCount: input.correctCount,
    incorrectCount: input.incorrectCount,
    timeSpentSecs: input.timeSpentSecs,
    starsEarned: stars,
    score,
    homeworkPeriodId: input.homeworkPeriodId,
    homeworkDate: input.homeworkDate,
  })

  if (isNewBest) {
    await mathRepo.upsertMathBestScore(studentId, input.minigame, input.level, score, stars)
  }

  await mathRepo.addUserPoints(studentId, pointsEarned)

  if (input.homeworkPeriodId && input.homeworkDate) {
    await homeworkRepo.markDone(input.homeworkPeriodId, studentId, input.homeworkDate)
  }

  // Awaited, and here rather than in the action. Awarding a badge is a business
  // rule, so it belongs in the service — and the action used to fire it with
  // `void`, which on a serverless runtime can be frozen before the promise
  // settles. That made the award both invisible and, occasionally, absent.
  const newBadgeIds = await checkAndAwardGameWinBadge(studentId)

  return { starsEarned: stars, score, pointsEarned, isNewBest, newBadgeIds }
}

/**
 * Returns today's pending math homework period for the given user, or null if none.
 * Used server-side by the /math page to pre-render the homework banner.
 */
export const getTodayMathHomework = async (
  studentId: string,
  _day: import('@/types').DayOfWeek | null,
  date: string
): Promise<{ periodId: string; homeworkNote: string } | null> => {
  const db = await import('@/lib/db').then((m) => m.db)
  const item = await db.dailyHomework.findFirst({
    where: { studentId, date, subjectId: 'math', isDone: false },
  })
  if (!item) return null
  return { periodId: item.id, homeworkNote: item.label }
}
