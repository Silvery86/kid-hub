import 'server-only'

import * as progressRepo from '@/server/repositories/progress.repository'

export const addUserPoints = (userId: string, points: number) =>
  progressRepo.addUserPoints(userId, points)

export const updateStreak = (userId: string) => progressRepo.updateStreak(userId)
