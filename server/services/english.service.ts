/**
 * Business logic for the English mini-game module.
 * Handles score calculation, best score updates, points award, and homework linkage.
 */

import 'server-only'

import * as englishRepo from '@/server/repositories/english.repository'
import * as homeworkRepo from '@/server/repositories/homework.repository'
import { calculateStars, calculatePointsEarned } from '@/hooks/useGameSession'
import { GAME_QUESTIONS_PER_SESSION } from '@/lib/constants'
import type { EnglishGameType, DifficultyLevel, SaveEnglishProgressInput } from '@/types'

export interface EnglishSessionResult {
  starsEarned: 1 | 2 | 3
  score: number
  pointsEarned: number
  isNewBest: boolean
}

/**
 * Persists a completed English session:
 *  1. Calculates stars and derived score.
 *  2. Compares against current best — updates only if improved.
 *  3. Awards points to user progress.
 *  4. If a homeworkPeriodId is provided, marks that period done for the given date.
 */
export const saveEnglishSession = async (
  userId: string,
  input: SaveEnglishProgressInput
): Promise<EnglishSessionResult> => {
  const stars = calculateStars(input.correctCount, GAME_QUESTIONS_PER_SESSION)
  const score = input.correctCount * 10
  const pointsEarned = calculatePointsEarned(input.correctCount, stars)

  const existing = await englishRepo.getEnglishBestScore(userId, input.minigame, input.level)
  const isNewBest = !existing || stars > existing.starsEarned

  await englishRepo.saveEnglishProgress({
    userId,
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
    await englishRepo.upsertEnglishBestScore(userId, input.minigame, input.level, score, stars)
  }

  await englishRepo.addUserPoints(userId, pointsEarned)

  if (input.homeworkPeriodId && input.homeworkDate) {
    await homeworkRepo.markDone(input.homeworkPeriodId, userId, input.homeworkDate)
  }

  return { starsEarned: stars, score, pointsEarned, isNewBest }
}

/**
 * Returns today's pending English homework period for the given user, or null if none.
 * Used server-side by the /english page to pre-render the homework banner.
 */
export const getTodayEnglishHomework = async (
  userId: string,
  day: import('@/types').DayOfWeek | null,
  date: string
): Promise<{ periodId: string; homeworkNote: string } | null> => {
  if (!day) return null

  const db = await import('@/lib/db').then((m) => m.db)
  const period = await db.classPeriod.findFirst({
    where: { userId, day, subjectId: 'english', isHomework: true },
    include: { homeworkCompletions: { where: { date } } },
  })

  if (!period) return null
  const completion = period.homeworkCompletions[0]
  if (completion?.isDone) return null

  return { periodId: period.id, homeworkNote: period.homeworkNote ?? '' }
}
