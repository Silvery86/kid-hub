/**
 * Server-only module — Prisma queries for English progress, best scores.
 * No business logic in this layer — pure data access only.
 */

import { db } from '@/lib/db'
import type { EnglishGameType, DifficultyLevel } from '@/types'
export { addUserPoints } from '@/server/repositories/progress.repository'

/** Persists a completed English mini-game session to the database. */
export const saveEnglishProgress = async (data: {
  userId: string
  minigame: EnglishGameType
  level: DifficultyLevel
  correctCount: number
  incorrectCount: number
  timeSpentSecs: number
  starsEarned: number
  score: number
  homeworkPeriodId?: string
  homeworkDate?: string
}): Promise<void> => {
  await db.englishProgress.create({
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

/** Returns the best score record for an English mini-game + level, or null if never played. */
export const getEnglishBestScore = async (
  userId: string,
  minigame: EnglishGameType,
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
        gameType: 'english',
        level,
        subType: minigame,
      },
    },
    select: { starsEarned: true, score: true },
  })
}

/** Upserts the best score for an English mini-game + level — only updates if the new score is better. */
export const upsertEnglishBestScore = async (
  userId: string,
  minigame: EnglishGameType,
  level: DifficultyLevel,
  score: number,
  starsEarned: number
): Promise<void> => {
  const progress = await db.userProgress.upsert({
    where: { userId },
    create: {
      userId,
      totalPoints: 0,
      currentStreak: 0,
      lastActiveDate: new Date().toISOString().split('T')[0]!,
    },
    update: {},
    select: { id: true },
  })

  await db.gameBestScore.upsert({
    where: {
      userProgressId_gameType_level_subType: {
        userProgressId: progress.id,
        gameType: 'english',
        level,
        subType: minigame,
      },
    },
    create: {
      userProgressId: progress.id,
      gameType: 'english',
      level,
      subType: minigame,
      score,
      starsEarned,
    },
    update: { score, starsEarned, achievedAt: new Date() },
  })
}

