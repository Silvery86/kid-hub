import 'server-only'

import {
  addUserPoints,
  updateStreak,
} from '@/server/repositories/progress.repository'

export const addPoints = async (userId: string, points: number): Promise<number> =>
  addUserPoints(userId, points)

export const incrementStreak = async (userId: string): Promise<number> =>
  updateStreak(userId)
