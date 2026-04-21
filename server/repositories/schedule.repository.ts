/**
 * Server-only module — all Prisma queries for schedule data live here.
 * No business logic in this layer — pure data access only.
 */

import { db } from '@/lib/db'
import type { DayOfWeek, ClassPeriod, DailySchedule } from '@/types'

export interface CreatePeriodInput {
  userId: string
  day: DayOfWeek
  periodNumber: number
  subjectId: string
  startTime: string
  endTime: string
  roomNumber?: string
}

export interface UpdatePeriodInput {
  id: string
  subjectId?: string
  startTime?: string
  endTime?: string
  roomNumber?: string
}

/**
 * Maps a DB ClassPeriod row to the shared ClassPeriod type.
 */
const toClassPeriod = (row: {
  periodNumber: number
  subjectId: string
  startTime: string
  endTime: string
  roomNumber: string | null
}): ClassPeriod => ({
  periodNumber: row.periodNumber,
  subjectId: row.subjectId,
  startTime: row.startTime,
  endTime: row.endTime,
  ...(row.roomNumber ? { roomNumber: row.roomNumber } : {}),
})

/** Retrieves the full weekly schedule for a user grouped by day. */
export const getWeeklySchedule = async (userId: string): Promise<DailySchedule[]> => {
  const rows = await db.classPeriod.findMany({
    where: { userId },
    orderBy: [{ day: 'asc' }, { periodNumber: 'asc' }],
  })

  const byDay = new Map<DayOfWeek, ClassPeriod[]>()
  for (const row of rows) {
    const day = row.day as DayOfWeek
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(toClassPeriod(row))
  }

  return Array.from(byDay.entries()).map(([day, periods]) => ({ day, periods }))
}

/** Retrieves the schedule for a specific day. */
export const getDaySchedule = async (
  userId: string,
  day: DayOfWeek
): Promise<DailySchedule | null> => {
  const rows = await db.classPeriod.findMany({
    where: { userId, day },
    orderBy: { periodNumber: 'asc' },
  })
  if (rows.length === 0) return null
  return { day, periods: rows.map(toClassPeriod) }
}

/** Inserts a new class period record. Returns the created period ID. */
export const createPeriod = async (data: CreatePeriodInput): Promise<string> => {
  const row = await db.classPeriod.create({
    data: {
      userId: data.userId,
      day: data.day,
      periodNumber: data.periodNumber,
      subjectId: data.subjectId,
      startTime: data.startTime,
      endTime: data.endTime,
      roomNumber: data.roomNumber,
    },
  })
  return row.id
}

/** Updates an existing class period record by its ID. */
export const updatePeriod = async (data: UpdatePeriodInput): Promise<void> => {
  await db.classPeriod.update({
    where: { id: data.id },
    data: {
      ...(data.subjectId ? { subjectId: data.subjectId } : {}),
      ...(data.startTime ? { startTime: data.startTime } : {}),
      ...(data.endTime ? { endTime: data.endTime } : {}),
      ...(data.roomNumber !== undefined ? { roomNumber: data.roomNumber } : {}),
    },
  })
}

/** Deletes a class period record by its ID. */
export const deletePeriod = async (id: string): Promise<void> => {
  await db.classPeriod.delete({ where: { id } })
}
