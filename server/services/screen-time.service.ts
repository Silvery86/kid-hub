import 'server-only'

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
