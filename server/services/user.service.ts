import 'server-only'

import {
  getUserById,
  getUserProgress,
  getKidAccessSettings,
  saveKidAccessSettings,
} from '@/server/repositories/user.repository'

export const findUserById = async (userId: string) => getUserById(userId)

export const fetchUserProgress = async (userId: string) => getUserProgress(userId)

export const fetchKidAccessSettings = async (
  userId: string
): Promise<Record<string, boolean> | null> => getKidAccessSettings(userId)

export const persistKidAccessSettings = async (
  userId: string,
  settings: Record<string, boolean>
): Promise<void> => saveKidAccessSettings(userId, settings)
