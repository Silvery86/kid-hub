/**
 * Server-only module — all Prisma queries for schedule data live here.
 * No business logic in this layer — pure data access only.
 */

import { db } from '@/lib/db'
import type {
  DayOfWeek,
  ClassPeriod,
  DailySchedule,
  DailyHomework,
  WeekSchedule,
  WeekSource,
} from '@/types'

// ── Input types ──────────────────────────────────────────────

export interface CreatePeriodInput {
  studentId: string
  day: DayOfWeek
  /** Monday of the week, for SCHOOL_PERIOD rows. Omitted for EXTRA_CLASS. */
  weekStartDate?: string
  periodNumber?: number
  eventType?: 'SCHOOL_PERIOD' | 'EXTRA_CLASS'
  subjectId: string
  note?: string
  startTime: string
  endTime: string
  roomNumber?: string
  iconKey?: string
  sortOrder?: number
}

export interface UpdatePeriodInput {
  id: string
  studentId: string
  subjectId?: string
  note?: string
  startTime?: string
  endTime?: string
  roomNumber?: string
  iconKey?: string
  sortOrder?: number
}

export interface CreateDailyHomeworkInput {
  studentId: string
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
  weekStartDate?: string | null
  eventType: string
  subjectId: string
  note: string | null
  startTime: string
  endTime: string
  roomNumber: string | null
  iconKey: string | null
  sortOrder: number
}): ClassPeriod => ({
  id: row.id,
  ...(row.periodNumber != null ? { periodNumber: row.periodNumber } : {}),
  ...(row.weekStartDate ? { weekStartDate: row.weekStartDate } : {}),
  eventType: row.eventType as ClassPeriod['eventType'],
  subjectId: row.subjectId,
  ...(row.note ? { note: row.note } : {}),
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

type PeriodRow = Parameters<typeof toClassPeriod>[0] & { day: DayOfWeek }

const groupByDay = (rows: PeriodRow[]): DailySchedule[] => {
  const byDay = new Map<DayOfWeek, ClassPeriod[]>()
  for (const row of rows) {
    if (!byDay.has(row.day)) byDay.set(row.day, [])
    byDay.get(row.day)!.push(toClassPeriod(row))
  }
  return Array.from(byDay.entries()).map(([day, periods]) => ({ day, periods }))
}

/**
 * Which week's rows actually answer for `weekStart`.
 *
 * A week the parent has edited has rows of its own. A week they have not falls
 * back to the most recent earlier STANDING week — the default timetable.
 *
 * Exception weeks are skipped, and that skip is the whole point: before it,
 * every saved week became the source of inheritance, so changing week 38 for a
 * single school event silently rewrote 39, 40 and 41 as well (§14).
 *
 * Returns null when no timetable has ever been entered.
 */
export const resolveWeekStart = async (
  studentId: string,
  weekStart: string
): Promise<{ weekStartDate: string; source: WeekSource } | null> => {
  const own = await db.classPeriod.findFirst({
    where: { studentId, eventType: 'SCHOOL_PERIOD', weekStartDate: weekStart },
    select: { id: true },
  })
  if (own) return { weekStartDate: weekStart, source: 'own' }

  const previous = await db.classPeriod.findFirst({
    where: {
      studentId,
      eventType: 'SCHOOL_PERIOD',
      isWeekException: false,
      weekStartDate: { lt: weekStart },
    },
    orderBy: { weekStartDate: 'desc' },
    select: { weekStartDate: true },
  })
  if (!previous?.weekStartDate) return null
  return { weekStartDate: previous.weekStartDate, source: 'inherited' }
}

/**
 * The timetable to show for `weekStart`, with where it came from.
 *
 * The provenance is returned rather than discarded because the grid behaves
 * differently for each: saving an inherited week creates rows, saving an own
 * week updates them.
 */
export const getWeekSchedule = async (
  studentId: string,
  weekStart: string
): Promise<WeekSchedule> => {
  const resolved = await resolveWeekStart(studentId, weekStart)
  if (!resolved) {
    return { weekStartDate: weekStart, source: 'empty', days: [] }
  }

  const rows = await db.classPeriod.findMany({
    where: {
      studentId,
      eventType: 'SCHOOL_PERIOD',
      weekStartDate: resolved.weekStartDate,
    },
    orderBy: [{ day: 'asc' }, { periodNumber: 'asc' }],
  })

  return {
    weekStartDate: weekStart,
    source: resolved.source,
    ...(resolved.source === 'inherited' ? { inheritedFrom: resolved.weekStartDate } : {}),
    days: groupByDay(rows),
  }
}

/** Rows the given week owns outright — the baseline a save diffs against. */
export const getOwnWeekSchedule = async (
  studentId: string,
  weekStart: string
): Promise<DailySchedule[]> => {
  const rows = await db.classPeriod.findMany({
    where: { studentId, eventType: 'SCHOOL_PERIOD', weekStartDate: weekStart },
    orderBy: [{ day: 'asc' }, { periodNumber: 'asc' }],
  })
  return groupByDay(rows)
}

/** Retrieves the full weekly SCHOOL_PERIOD schedule for one week, grouped by day. */
export const getWeeklySchedule = async (
  studentId: string,
  weekStart: string
): Promise<DailySchedule[]> => (await getWeekSchedule(studentId, weekStart)).days

/** Retrieves the SCHOOL_PERIOD schedule for one weekday of one week. */
export const getDaySchedule = async (
  studentId: string,
  day: DayOfWeek,
  weekStart: string
): Promise<DailySchedule | null> => {
  const resolved = await resolveWeekStart(studentId, weekStart)
  if (!resolved) return null
  const rows = await db.classPeriod.findMany({
    where: {
      studentId,
      day,
      eventType: 'SCHOOL_PERIOD',
      weekStartDate: resolved.weekStartDate,
    },
    orderBy: { periodNumber: 'asc' },
  })
  if (rows.length === 0) return null
  return { day, periods: rows.map(toClassPeriod) }
}

/** Retrieves the stored time range for a single period owned by the user. */
export const getPeriodTimes = async (
  id: string,
  studentId: string
): Promise<{ startTime: string; endTime: string } | null> =>
  db.classPeriod.findFirst({
    where: { id, studentId },
    select: { startTime: true, endTime: true },
  })

/** Inserts a new class period record. Returns the created period ID. */
export const createPeriod = async (data: CreatePeriodInput): Promise<string> => {
  const row = await db.classPeriod.create({
    data: {
      studentId: data.studentId,
      day: data.day,
      weekStartDate: data.weekStartDate ?? null,
      periodNumber: data.periodNumber ?? null,
      eventType: data.eventType ?? 'SCHOOL_PERIOD',
      subjectId: data.subjectId,
      note: data.note || null,
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
    where: { id: data.id, studentId: data.studentId },
    data: {
      ...(data.subjectId ? { subjectId: data.subjectId } : {}),
      ...(data.note !== undefined ? { note: data.note || null } : {}),
      ...(data.startTime ? { startTime: data.startTime } : {}),
      ...(data.endTime ? { endTime: data.endTime } : {}),
      ...(data.roomNumber !== undefined ? { roomNumber: data.roomNumber } : {}),
      ...(data.iconKey !== undefined ? { iconKey: data.iconKey } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
  })
}

/** Deletes a class period record by its ID. */
export const deletePeriod = async (id: string, studentId: string): Promise<void> => {
  await db.classPeriod.delete({ where: { id, studentId } })
}

// ── Evening extra class queries ──────────────────────────────

/** Retrieves all EXTRA_CLASS entries for a given day, sorted by startTime. */
export const getEveningBlocks = async (
  studentId: string,
  day: DayOfWeek
): Promise<ClassPeriod[]> => {
  const rows = await db.classPeriod.findMany({
    where: { studentId, day, eventType: 'EXTRA_CLASS' },
    orderBy: [{ sortOrder: 'asc' }, { startTime: 'asc' }],
  })
  return rows.map(toClassPeriod)
}

/** Retrieves ALL EXTRA_CLASS entries for a user, grouped by day. */
export const getAllEveningBlocks = async (studentId: string): Promise<DailySchedule[]> => {
  const rows = await db.classPeriod.findMany({
    where: { studentId, eventType: 'EXTRA_CLASS' },
    orderBy: [{ day: 'asc' }, { sortOrder: 'asc' }, { startTime: 'asc' }],
  })
  const byDay = new Map<DayOfWeek, ClassPeriod[]>()
  for (const row of rows) {
    const day = row.day as DayOfWeek
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(toClassPeriod(row))
  }
  return Array.from(byDay.entries()).map(([day, periods]) => ({ day, periods }))
}

/** Returns periodIds that have an ExtraClassOverride for the given date. */
export const getOverridesForDate = async (
  studentId: string,
  date: string
): Promise<string[]> => {
  const rows = await db.extraClassOverride.findMany({
    where: { studentId, date },
    select: { periodId: true },
  })
  return rows.map((r) => r.periodId)
}

/** Creates a per-date cancellation override for an extra class. */
export const createOverride = async (
  periodId: string,
  studentId: string,
  date: string,
  reason?: string
): Promise<void> => {
  await db.$transaction(async (tx) => {
    // The (periodId, date) unique carries no studentId, so the upsert on its own would
    // let a caller cancel a class period belonging to someone else.
    const owned = await tx.classPeriod.findFirst({
      where: { id: periodId, studentId },
      select: { id: true },
    })
    if (!owned) throw new Error('Class period not found')

    await tx.extraClassOverride.upsert({
      where: { periodId_date: { periodId, date } },
      create: { periodId, studentId, date, reason: reason ?? null },
      update: { reason: reason ?? null },
    })
  })
}

/** Removes a per-date override (un-cancels a class). */
export const deleteOverride = async (
  periodId: string,
  studentId: string,
  date: string
): Promise<void> => {
  await db.extraClassOverride.deleteMany({ where: { periodId, studentId, date } })
}

// ── Daily homework queries ───────────────────────────────────

/** Retrieves all one-off homework items for a specific date. */
export const getDailyHomework = async (
  studentId: string,
  date: string
): Promise<DailyHomework[]> => {
  const rows = await db.dailyHomework.findMany({
    where: { studentId, date },
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
      studentId: data.studentId,
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
  studentId: string,
  isDone: boolean
): Promise<DailyHomework> => {
  const row = await db.dailyHomework.update({
    where: { id, studentId },
    data: {
      isDone,
      doneAt: isDone ? new Date() : null,
    },
  })
  return toDailyHomework(row)
}

/** Deletes a daily homework item by ID. */
export const deleteDailyHomework = async (id: string, studentId: string): Promise<void> => {
  await db.dailyHomework.delete({ where: { id, studentId } })
}

/** Counts how many EXTRA_CLASS blocks a user has on a given day. */
export const countEveningBlocks = async (
  studentId: string,
  day: DayOfWeek
): Promise<number> =>
  db.classPeriod.count({ where: { studentId, day, eventType: 'EXTRA_CLASS' } })

// ── Week-at-a-time save ──────────────────────────────────────

export interface WeekWriteRow {
  day: DayOfWeek
  periodNumber: number
  subjectId: string
  note?: string
  startTime: string
  endTime: string
}

/**
 * Applies a whole week in ONE transaction.
 *
 * Previously the parent screen issued one Server Action per period — 35 serial
 * round-trips for a full timetable, each re-running the guard, Zod and
 * revalidatePath. A failure at period 20 left 19 rows written with no rollback
 * and an error that did not say where it stopped. Here the week either lands or
 * it does not.
 *
 * Deletes run first so a subject moving into a slot that another row is leaving
 * cannot collide with the unique constraint mid-write.
 */
export const replaceWeeklySchedule = async (
  studentId: string,
  weekStart: string,
  created: WeekWriteRow[],
  updated: (WeekWriteRow & { id: string })[],
  deletedIds: string[],
  isWeekException = false
): Promise<void> => {
  await db.$transaction(async (tx) => {
    if (deletedIds.length > 0) {
      await tx.classPeriod.deleteMany({ where: { id: { in: deletedIds }, studentId } })
    }

    for (const row of updated) {
      await tx.classPeriod.updateMany({
        where: { id: row.id, studentId },
        data: {
          subjectId: row.subjectId,
          note: row.note || null,
          startTime: row.startTime,
          endTime: row.endTime,
        },
      })
    }

    if (created.length > 0) {
      await tx.classPeriod.createMany({
        data: created.map((row) => ({
          studentId,
          day: row.day,
          weekStartDate: weekStart,
          isWeekException,
          periodNumber: row.periodNumber,
          eventType: 'SCHOOL_PERIOD' as const,
          subjectId: row.subjectId,
          note: row.note || null,
          startTime: row.startTime,
          endTime: row.endTime,
        })),
      })
    }

    // Scope belongs to the WEEK, not to the cells that happened to change. A
    // parent re-saving an unchanged grid as "this week only" must move every
    // row, or the week would be half standing and half exception and the
    // fallback would still find it.
    await tx.classPeriod.updateMany({
      where: { studentId, eventType: 'SCHOOL_PERIOD', weekStartDate: weekStart },
      data: { isWeekException },
    })
  })
}

/**
 * Copies one week's timetable into a list of later weeks.
 *
 * Weeks that already hold their own rows are replaced outright rather than
 * merged: the parent asked for "make these weeks look like this one", and a
 * merge would leave a subject they had deleted still sitting in the target.
 * `skipWeeks` is how the caller honours "don't overwrite what I already
 * customised" — the decision is theirs, taken in the dialog, not here.
 *
 * One transaction for the whole run, so a copy that fails at week 12 does not
 * leave weeks 1–11 written and the rest not.
 */
export const copyWeekInto = async (
  studentId: string,
  fromWeek: string,
  targetWeeks: string[],
  skipWeeks: string[] = []
): Promise<{ weeksWritten: number; rowsWritten: number }> => {
  // The source is what the parent sees, which for a week they have not edited
  // is an earlier week's rows. Reading `fromWeek` literally would copy nothing
  // and report success.
  const resolved = await resolveWeekStart(studentId, fromWeek)
  if (!resolved) return { weeksWritten: 0, rowsWritten: 0 }

  const source = await db.classPeriod.findMany({
    where: {
      studentId,
      eventType: 'SCHOOL_PERIOD',
      weekStartDate: resolved.weekStartDate,
    },
  })
  if (source.length === 0) return { weeksWritten: 0, rowsWritten: 0 }

  const skip = new Set(skipWeeks)
  const targets = targetWeeks.filter((week) => !skip.has(week) && week !== fromWeek)
  if (targets.length === 0) return { weeksWritten: 0, rowsWritten: 0 }

  await db.$transaction(async (tx) => {
    await tx.classPeriod.deleteMany({
      where: {
        studentId,
        eventType: 'SCHOOL_PERIOD',
        weekStartDate: { in: targets },
      },
    })

    await tx.classPeriod.createMany({
      data: targets.flatMap((week) =>
        source.map((row) => ({
          studentId,
          day: row.day,
          weekStartDate: week,
          // Copies pin the weeks they land in. Making them standing would put
          // the last copied week in charge of everything after it.
          isWeekException: true,
          periodNumber: row.periodNumber,
          eventType: 'SCHOOL_PERIOD' as const,
          subjectId: row.subjectId,
          note: row.note,
          startTime: row.startTime,
          endTime: row.endTime,
          roomNumber: row.roomNumber,
          iconKey: row.iconKey,
          sortOrder: row.sortOrder,
        }))
      ),
    })
  })

  return { weeksWritten: targets.length, rowsWritten: targets.length * source.length }
}

/** Which of `weeks` already hold rows of their own — what a copy would overwrite. */
export const findWeeksWithOwnRows = async (
  studentId: string,
  weeks: string[]
): Promise<string[]> => {
  if (weeks.length === 0) return []
  const rows = await db.classPeriod.groupBy({
    by: ['weekStartDate'],
    where: {
      studentId,
      eventType: 'SCHOOL_PERIOD',
      weekStartDate: { in: weeks },
    },
  })
  return rows.map((r) => r.weekStartDate).filter((w): w is string => w != null)
}
