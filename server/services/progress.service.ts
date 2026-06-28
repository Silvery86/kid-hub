import 'server-only'

<<<<<<< HEAD
import {
  addUserPoints,
  updateStreak,
} from '@/server/repositories/progress.repository'

export const addPoints = async (userId: string, points: number): Promise<number> =>
  addUserPoints(userId, points)

export const incrementStreak = async (userId: string): Promise<number> =>
  updateStreak(userId)
=======
import * as progressRepo from '@/server/repositories/progress.repository'

export const addUserPoints = (userId: string, points: number) =>
  progressRepo.addUserPoints(userId, points)

export const updateStreak = (userId: string) => progressRepo.updateStreak(userId)
>>>>>>> main
