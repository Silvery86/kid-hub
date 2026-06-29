/** Server-only — ScreenTimeLog data access. No business logic. */

import { db } from '@/lib/db'

const todayStr = (): string => new Date().toISOString().split('T')[0]!

/** Adds `secs` to today's running total. Creates the record if it doesn't exist yet. */
export const addScreenTime = async (userId: string, secs: number): Promise<void> => {
  const date = todayStr()
  await db.screenTimeLog.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, totalSecs: secs },
    update: { totalSecs: { increment: secs } },
  })
}

/** Returns today's accumulated seconds for a user. Returns 0 if no record. */
export const getScreenTimeToday = async (userId: string): Promise<number> => {
  const date = todayStr()
  const row = await db.screenTimeLog.findUnique({
    where: { userId_date: { userId, date } },
    select: { totalSecs: true },
  })
  return row?.totalSecs ?? 0
}

/** Returns the parent-configured daily limit in minutes for a user. */
export const getScreenTimeLimit = async (userId: string): Promise<number> => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { screenTimeLimitMins: true },
  })
  return user?.screenTimeLimitMins ?? 120
}

/** Updates the parent-configured daily screen time limit. */
export const setScreenTimeLimit = async (userId: string, limitMins: number): Promise<void> => {
  await db.user.update({
    where: { id: userId },
    data: { screenTimeLimitMins: limitMins },
  })
}
