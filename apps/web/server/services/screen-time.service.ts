import 'server-only'

import * as screenTimeRepo from '@/server/repositories/screen-time.repository'

export const addScreenTime = (studentId: string, secs: number) =>
  screenTimeRepo.addScreenTime(studentId, secs)

export const getScreenTimeToday = (studentId: string) =>
  screenTimeRepo.getScreenTimeToday(studentId)

export const getScreenTimeLimit = (studentId: string) =>
  screenTimeRepo.getScreenTimeLimit(studentId)

export const setScreenTimeLimit = (studentId: string, limitMins: number) =>
  screenTimeRepo.setScreenTimeLimit(studentId, limitMins)
