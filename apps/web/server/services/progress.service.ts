import 'server-only'

import * as progressRepo from '@/server/repositories/progress.repository'

export const addUserPoints = (studentId: string, points: number) =>
  progressRepo.addUserPoints(studentId, points)

export const updateStreak = (studentId: string) => progressRepo.updateStreak(studentId)
