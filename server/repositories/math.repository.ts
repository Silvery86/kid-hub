/**
 * Server-only module — Prisma queries for math progress, best scores, and homework completion.
 * No business logic in this layer — pure data access only.
 */

import { db } from '@/lib/db'
import type { MathGameType, DifficultyLevel } from '@/types'

/** Persists a completed math mini-game session to the database. */
export const saveMathProgress = async (data: {
  userId: string
  minigame: MathGameType
  level: DifficultyLevel
  correctCount: number
  incorrectCount: number
  timeSpentSecs: number
  starsEarned: number
  score: number
  homeworkPeriodId?: string
  homeworkDate?: string
}): Promise<void> => {
  await db.mathProgress.create({
    data: {
      userId: data.userId,
      minigame: data.minigame,
      level: data.level,
      correctCount: data.correctCount,
      incorrectCount: data.incorrectCount,
      timeSpentSecs: data.timeSpentSecs,
      starsEarned: data.starsEarned,
      score: data.score,
      homeworkPeriodId: data.homeworkPeriodId ?? null,
      homeworkDate: data.homeworkDate ?? null,
    },
  })
}

/** Returns the best score record for a math mini-game + level, or null if never played. */
export const getMathBestScore = async (
  userId: string,
  minigame: MathGameType,
  level: DifficultyLevel
): Promise<{ starsEarned: number; score: number } | null> => {
  const progress = await db.userProgress.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!progress) return null

  return db.gameBestScore.findUnique({
    where: {
      userProgressId_gameType_level_subType: {
        userProgressId: progress.id,
        gameType: 'math',
        level,
        subType: minigame,
      },
    },
    select: { starsEarned: true, score: true },
  })
}

/** Upserts the best score for a math mini-game + level — only updates if the new score is better. */
export const upsertMathBestScore = async (
  userId: string,
  minigame: MathGameType,
  level: DifficultyLevel,
  score: number,
  starsEarned: number
): Promise<void> => {
  const progress = await db.userProgress.upsert({
    where: { userId },
    create: { userId, totalPoints: 0, currentStreak: 0, lastActiveDate: new Date().toISOString().split('T')[0]! },
    update: {},
    select: { id: true },
  })

  await db.gameBestScore.upsert({
    where: {
      userProgressId_gameType_level_subType: {
        userProgressId: progress.id,
        gameType: 'math',
        level,
        subType: minigame,
      },
    },
    create: {
      userProgressId: progress.id,
      gameType: 'math',
      level,
      subType: minigame,
      score,
      starsEarned,
    },
    update: { score, starsEarned, achievedAt: new Date() },
  })
}

/** Adds points to the user's total progress and updates lastActiveDate for streak tracking. */
export const addUserPoints = async (userId: string, points: number): Promise<void> => {
  const today = new Date().toISOString().split('T')[0]!
  await db.userProgress.upsert({
    where: { userId },
    create: { userId, totalPoints: points, currentStreak: 1, lastActiveDate: today },
    update: { totalPoints: { increment: points }, lastActiveDate: today },
  })
}
