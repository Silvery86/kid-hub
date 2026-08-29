/** Server-only — ScreenTimeLog data access. No business logic. */

import { db } from '@/lib/db'

const todayStr = (): string => new Date().toISOString().split('T')[0]!

/** Adds `secs` to today's running total. Creates the record if it doesn't exist yet. */
export const addScreenTime = async (studentId: string, secs: number): Promise<void> => {
  const date = todayStr()
  await db.screenTimeLog.upsert({
    where: { studentId_date: { studentId, date } },
    create: { studentId, date, totalSecs: secs },
    update: { totalSecs: { increment: secs } },
  })
}

/** Returns today's accumulated seconds for a user. Returns 0 if no record. */
export const getScreenTimeToday = async (studentId: string): Promise<number> => {
  const date = todayStr()
  const row = await db.screenTimeLog.findUnique({
    where: { studentId_date: { studentId, date } },
    select: { totalSecs: true },
  })
  return row?.totalSecs ?? 0
}

/** Returns the parent-configured daily limit in minutes for a student. */
export const getScreenTimeLimit = async (studentId: string): Promise<number> => {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { screenTimeLimitMins: true },
  })
  return student?.screenTimeLimitMins ?? 120
}

/** Updates the parent-configured daily screen time limit. */
export const setScreenTimeLimit = async (studentId: string, limitMins: number): Promise<void> => {
  await db.student.update({
    where: { id: studentId },
    data: { screenTimeLimitMins: limitMins },
  })
}
