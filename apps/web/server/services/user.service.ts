import 'server-only'

import * as userRepo from '@/server/repositories/user.repository'

export const getUserProgress = (userId: string) => userRepo.getUserProgress(userId)

export const getUserById = (userId: string) => userRepo.getUserById(userId)

export const getKidAccessSettings = (userId: string) =>
  userRepo.getKidAccessSettings(userId)

export const saveKidAccessSettings = (userId: string, settings: Record<string, boolean>) =>
  userRepo.saveKidAccessSettings(userId, settings)
