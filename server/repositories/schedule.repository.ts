/**
 * Server-only module — all Prisma queries for schedule data live here.
 * No business logic in this layer — pure data access only.
 */

import { db } from '@/lib/db'
import type { DayOfWeek, ClassPeriod, DailySchedule, DailyHomework } from '@/types'

// ── Input types ──────────────────────────────────────────────

export interface CreatePeriodInput {
  userId: string
  day: DayOfWeek
  periodNumber?: number
  eventType?: 'SCHOOL_PERIOD' | 'EXTRA_CLASS'
  subjectId: string
  startTime: string
  endTime: string
  roomNumber?: string
  iconKey?: string
  sortOrder?: number
}

export interface UpdatePeriodInput {
  id: string
  subjectId?: string
  startTime?: string
  endTime?: string
  roomNumber?: string
  iconKey?: string
  sortOrder?: number
}

export interface CreateDailyHomeworkInput {
  userId: string
  date: string
  subjectId: string
  label: string
  iconKey?: string
  points?: number
}

// ── Mappers ───────────────────────────────────────────────────

const toClassPeriod = (row: {
  id: string
  periodNumber: number | null
  eventType: string
  subjectId: string
  startTime: string
  endTime: string
  roomNumber: string | null
  iconKey: string | null
  sortOrder: number
}): ClassPeriod => ({
  id: row.id,
  ...(row.periodNumber != null ? { periodNumber: row.periodNumber } : {}),
  eventType: row.eventType as ClassPeriod['eventType'],
  subjectId: row.subjectId,
  startTime: row.startTime,
  endTime: row.endTime,
  ...(row.roomNumber ? { roomNumber: row.roomNumber } : {}),
  ...(row.iconKey ? { iconKey: row.iconKey } : {}),
  sortOrder: row.sortOrder,
})

const toDailyHomework = (row: {
  id: string
  date: string
  subjectId: string
  label: string
  iconKey: string | null
  isDone: boolean
  doneAt: Date | null
  points: number
}): DailyHomework => ({
  id: row.id,
  date: row.date,
  subjectId: row.subjectId,
  label: row.label,
  ...(row.iconKey ? { iconKey: row.iconKey } : {}),
  isDone: row.isDone,
  ...(row.doneAt ? { doneAt: row.doneAt.toISOString() } : {}),
  points: row.points,
})

// ── School period queries ────────────────────────────────────

/** Retrieves the full weekly SCHOOL_PERIOD schedule grouped by day. */
export const getWeeklySchedule = async (userId: string): Promise<DailySchedule[]> => {
  const rows = await db.classPeriod.findMany({
    where: { userId, eventType: 'SCHOOL_PERIOD' },
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

/** Retrieves SCHOOL_PERIOD schedule for a specific day. */
export const getDaySchedule = async (
  userId: string,
  day: DayOfWeek
): Promise<DailySchedule | null> => {
  const rows = await db.classPeriod.findMany({
    where: { userId, day, eventType: 'SCHOOL_PERIOD' },
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
      periodNumber: data.periodNumber ?? null,
      eventType: data.eventType ?? 'SCHOOL_PERIOD',
      subjectId: data.subjectId,
      startTime: data.startTime,
      endTime: data.endTime,
      roomNumber: data.roomNumber ?? null,
      iconKey: data.iconKey ?? null,
      sortOrder: data.sortOrder ?? 0,
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
      ...(data.iconKey !== undefined ? { iconKey: data.iconKey } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
  })
}

/** Deletes a class period record by its ID. */
export const deletePeriod = async (id: string): Promise<void> => {
  await db.classPeriod.delete({ where: { id } })
}

// ── Evening extra class queries ──────────────────────────────

/** Retrieves all EXTRA_CLASS entries for a given day, sorted by startTime. */
export const getEveningBlocks = async (
  userId: string,
  day: DayOfWeek
): Promise<ClassPeriod[]> => {
  const rows = await db.classPeriod.findMany({
    where: { userId, day, eventType: 'EXTRA_CLASS' },
    orderBy: [{ sortOrder: 'asc' }, { startTime: 'asc' }],
  })
  return rows.map(toClassPeriod)
}

/** Returns periodIds that have an ExtraClassOverride for the given date. */
export const getOverridesForDate = async (
  userId: string,
  date: string
): Promise<string[]> => {
  const rows = await db.extraClassOverride.findMany({
    where: { userId, date },
    select: { periodId: true },
  })
  return rows.map((r) => r.periodId)
}

/** Creates a per-date cancellation override for an extra class. */
export const createOverride = async (
  periodId: string,
  userId: string,
  date: string,
  reason?: string
): Promise<void> => {
  await db.extraClassOverride.upsert({
    where: { periodId_date: { periodId, date } },
    create: { periodId, userId, date, reason: reason ?? null },
    update: { reason: reason ?? null },
  })
}

/** Removes a per-date override (un-cancels a class). */
export const deleteOverride = async (periodId: string, date: string): Promise<void> => {
  await db.extraClassOverride.deleteMany({ where: { periodId, date } })
}

// ── Daily homework queries ───────────────────────────────────

/** Retrieves all one-off homework items for a specific date. */
export const getDailyHomework = async (
  userId: string,
  date: string
): Promise<DailyHomework[]> => {
  const rows = await db.dailyHomework.findMany({
    where: { userId, date },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(toDailyHomework)
}

/** Creates a one-off homework item. Returns the created ID. */
export const createDailyHomework = async (
  data: CreateDailyHomeworkInput
): Promise<string> => {
  const row = await db.dailyHomework.create({
    data: {
      userId: data.userId,
      date: data.date,
      subjectId: data.subjectId,
      label: data.label,
      iconKey: data.iconKey ?? null,
      points: data.points ?? 10,
    },
  })
  return row.id
}

/** Toggles isDone on a daily homework item. Returns the updated record. */
export const toggleDailyHomeworkDone = async (
  id: string,
  userId: string,
  isDone: boolean
): Promise<DailyHomework> => {
  const row = await db.dailyHomework.update({
    where: { id, userId },
    data: {
      isDone,
      doneAt: isDone ? new Date() : null,
    },
  })
  return toDailyHomework(row)
}

/** Deletes a daily homework item by ID. */
export const deleteDailyHomework = async (id: string, userId: string): Promise<void> => {
  await db.dailyHomework.delete({ where: { id, userId } })
}

/** Counts how many EXTRA_CLASS blocks a user has on a given day. */
export const countEveningBlocks = async (
  userId: string,
  day: DayOfWeek
): Promise<number> =>
  db.classPeriod.count({ where: { userId, day, eventType: 'EXTRA_CLASS' } })
