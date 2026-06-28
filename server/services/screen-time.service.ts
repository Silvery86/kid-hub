import 'server-only'

<<<<<<< HEAD
import {
  addScreenTime,
  getScreenTimeToday,
  getScreenTimeLimit,
  setScreenTimeLimit,
} from '@/server/repositories/screen-time.repository'

export const recordScreenTime = async (userId: string, secs: number): Promise<void> =>
  addScreenTime(userId, secs)

export const getTodayScreenTime = async (userId: string): Promise<number> =>
  getScreenTimeToday(userId)

export const getDailyLimit = async (userId: string): Promise<number> =>
  getScreenTimeLimit(userId)

export const setDailyLimit = async (userId: string, limitMins: number): Promise<void> =>
  setScreenTimeLimit(userId, limitMins)
=======
import * as screenTimeRepo from '@/server/repositories/screen-time.repository'

export const addScreenTime = (userId: string, secs: number) =>
  screenTimeRepo.addScreenTime(userId, secs)

export const getScreenTimeToday = (userId: string) =>
  screenTimeRepo.getScreenTimeToday(userId)

export const getScreenTimeLimit = (userId: string) =>
  screenTimeRepo.getScreenTimeLimit(userId)

export const setScreenTimeLimit = (userId: string, limitMins: number) =>
  screenTimeRepo.setScreenTimeLimit(userId, limitMins)
>>>>>>> main
