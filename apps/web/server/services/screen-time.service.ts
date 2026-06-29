import 'server-only'

import * as screenTimeRepo from '@/server/repositories/screen-time.repository'

export const addScreenTime = (userId: string, secs: number) =>
  screenTimeRepo.addScreenTime(userId, secs)

export const getScreenTimeToday = (userId: string) =>
  screenTimeRepo.getScreenTimeToday(userId)

export const getScreenTimeLimit = (userId: string) =>
  screenTimeRepo.getScreenTimeLimit(userId)

export const setScreenTimeLimit = (userId: string, limitMins: number) =>
  screenTimeRepo.setScreenTimeLimit(userId, limitMins)
