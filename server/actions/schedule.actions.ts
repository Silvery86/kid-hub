'use server'

/**
 * Server Actions for weekly schedule: query and CRUD operations on class periods,
 * daily homework, and extra-class overrides.
 * All mutations are validated with Zod and guarded by parent session check.
 */

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { verifySessionToken, SESSION_COOKIE } from '@/server/services/auth.service'
import { validatePeriodOverlap, buildTodayView, jsDateToDayOfWeek } from '@/server/services/schedule.service'
import * as scheduleRepo from '@/server/repositories/schedule.repository'
import type { DayOfWeek, DailySchedule, TodayView } from '@/types'
import { DEFAULT_USER_ID, MAX_EVENING_BLOCKS_PER_DAY } from '@/lib/constants'

// ── Schemas ───────────────────────────────────────────────────

const DaySchema = z.enum([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
])

const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/)

const CreatePeriodSchema = z.object({
  day: DaySchema,
  periodNumber: z.number().int().min(1).max(10),
  subjectId: z.string().min(1),
  startTime: TimeSchema,
  endTime: TimeSchema,
  roomNumber: z.string().optional(),
})

const CreateExtraClassSchema = z.object({
  day: DaySchema,
  subjectId: z.string().min(1),
  startTime: TimeSchema,
  endTime: TimeSchema,
  iconKey: z.string().max(30).optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const UpdatePeriodSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1).optional(),
  startTime: TimeSchema.optional(),
  endTime: TimeSchema.optional(),
  roomNumber: z.string().optional(),
  iconKey: z.string().max(30).optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const AddDailyHomeworkSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  subjectId: z.string().min(1),
  label: z.string().min(1).max(150),
  iconKey: z.string().max(30).optional(),
  points: z.number().int().min(1).max(50).optional(),
})

// ── Auth guard ────────────────────────────────────────────────

const requireParentSession = async (): Promise<void> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) throw new Error('Unauthorized')
  const session = await verifySessionToken(token)
  if (!session) throw new Error('Unauthorized')
}

const todayStr = (): string => new Date().toISOString().split('T')[0]!

// ── Read actions ──────────────────────────────────────────────

/** Retrieves the weekly SCHOOL_PERIOD schedule, optionally filtered to a specific day. */
export const getScheduleAction = async (
  day?: DayOfWeek
): Promise<{ success: boolean; data?: DailySchedule[]; error?: string }> => {
  try {
    if (day) {
      const result = await scheduleRepo.getDaySchedule(DEFAULT_USER_ID, day)
      return { success: true, data: result ? [result] : [] }
    }
    const data = await scheduleRepo.getWeeklySchedule(DEFAULT_USER_ID)
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to fetch schedule' }
  }
}

/** Builds a complete TodayView: school periods + evening blocks + overrides + homework. */
export const getTodayViewAction = async (): Promise<{
  success: boolean
  data?: TodayView
  error?: string
}> => {
  try {
    const today = new Date()
    const date = todayStr()
    const dow = jsDateToDayOfWeek(today)

    const [schoolResult, eveningBlocks, cancelledIds, homework] = await Promise.all([
      dow ? scheduleRepo.getDaySchedule(DEFAULT_USER_ID, dow) : Promise.resolve(null),
      dow ? scheduleRepo.getEveningBlocks(DEFAULT_USER_ID, dow) : Promise.resolve([]),
      scheduleRepo.getOverridesForDate(DEFAULT_USER_ID, date),
      scheduleRepo.getDailyHomework(DEFAULT_USER_ID, date),
    ])

    const todayView = buildTodayView(
      date,
      schoolResult?.periods ?? [],
      eveningBlocks,
      cancelledIds,
      homework
    )
    return { success: true, data: todayView }
  } catch {
    return { success: false, error: 'Failed to fetch today view' }
  }
}

// ── School period mutations ───────────────────────────────────

/** Creates a new SCHOOL_PERIOD. Validates overlap and revalidates affected paths. */
export const createPeriodAction = async (
  input: unknown
): Promise<{ success: boolean; error?: string }> => {
  try {
    await requireParentSession()
    const parsed = CreatePeriodSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const data = parsed.data
    const existing = await scheduleRepo.getDaySchedule(DEFAULT_USER_ID, data.day as DayOfWeek)
    const newPeriod = {
      periodNumber: data.periodNumber,
      subjectId: data.subjectId,
      startTime: data.startTime,
      endTime: data.endTime,
    }
    if (existing && validatePeriodOverlap(newPeriod, existing.periods)) {
      return { success: false, error: 'This time slot overlaps with an existing period' }
    }
    await scheduleRepo.createPeriod({
      ...data,
      userId: DEFAULT_USER_ID,
      day: data.day as DayOfWeek,
      eventType: 'SCHOOL_PERIOD',
    })
    revalidatePath('/dashboard')
    revalidatePath('/schedule')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create period'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/** Updates an existing class period by ID. */
export const updatePeriodAction = async (
  input: unknown
): Promise<{ success: boolean; error?: string }> => {
  try {
    await requireParentSession()
    const parsed = UpdatePeriodSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    await scheduleRepo.updatePeriod(parsed.data)
    revalidatePath('/dashboard')
    revalidatePath('/schedule')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update period'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/** Deletes a class period by ID. */
export const deletePeriodAction = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await requireParentSession()
    const parsed = z.string().min(1).safeParse(id)
    if (!parsed.success) return { success: false, error: 'Invalid period ID' }
    await scheduleRepo.deletePeriod(parsed.data)
    revalidatePath('/dashboard')
    revalidatePath('/schedule')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete period'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

// ── Extra class mutations ────────────────────────────────────

/** Creates a recurring EXTRA_CLASS entry. Enforces the 3-block-per-day cap. */
export const createExtraClassAction = async (
  input: unknown
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    await requireParentSession()
    const parsed = CreateExtraClassSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const data = parsed.data
    const count = await scheduleRepo.countEveningBlocks(DEFAULT_USER_ID, data.day as DayOfWeek)
    if (count >= MAX_EVENING_BLOCKS_PER_DAY) {
      return { success: false, error: `Tối đa ${MAX_EVENING_BLOCKS_PER_DAY} buổi học thêm mỗi ngày` }
    }
    const id = await scheduleRepo.createPeriod({
      ...data,
      userId: DEFAULT_USER_ID,
      day: data.day as DayOfWeek,
      eventType: 'EXTRA_CLASS',
    })
    revalidatePath('/schedule')
    return { success: true, id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create extra class'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/** Cancels a recurring extra class for a specific date (creates an override). */
export const cancelExtraClassAction = async (
  periodId: string,
  date: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await requireParentSession()
    const idParsed = z.string().min(1).safeParse(periodId)
    const dateParsed = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(date)
    if (!idParsed.success || !dateParsed.success) {
      return { success: false, error: 'Invalid input' }
    }
    await scheduleRepo.createOverride(periodId, DEFAULT_USER_ID, date, reason)
    revalidatePath('/schedule')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to cancel class'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/** Removes a cancellation override (restores a class for that date). */
export const restoreExtraClassAction = async (
  periodId: string,
  date: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await requireParentSession()
    await scheduleRepo.deleteOverride(periodId, date)
    revalidatePath('/schedule')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to restore class'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

// ── Daily homework mutations ──────────────────────────────────

/** Creates a one-off daily homework item (parent action). */
export const addDailyHomeworkAction = async (
  input: unknown
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    await requireParentSession()
    const parsed = AddDailyHomeworkSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const id = await scheduleRepo.createDailyHomework({
      ...parsed.data,
      userId: DEFAULT_USER_ID,
    })
    revalidatePath('/schedule')
    return { success: true, id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to add homework'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/** Toggles isDone on a daily homework item (kid action — no parent session required). */
export const toggleHomeworkDoneAction = async (
  id: string,
  isDone: boolean
): Promise<{ success: boolean; points?: number; error?: string }> => {
  try {
    const parsed = z.object({ id: z.string().min(1), isDone: z.boolean() }).safeParse({ id, isDone })
    if (!parsed.success) return { success: false, error: 'Invalid input' }
    const updated = await scheduleRepo.toggleDailyHomeworkDone(
      parsed.data.id,
      DEFAULT_USER_ID,
      parsed.data.isDone
    )
    revalidatePath('/schedule')
    return { success: true, points: isDone ? updated.points : 0 }
  } catch {
    return { success: false, error: 'Failed to update homework' }
  }
}

/** Deletes a daily homework item (parent action). */
export const deleteDailyHomeworkAction = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await requireParentSession()
    const parsed = z.string().min(1).safeParse(id)
    if (!parsed.success) return { success: false, error: 'Invalid ID' }
    await scheduleRepo.deleteDailyHomework(parsed.data, DEFAULT_USER_ID)
    revalidatePath('/schedule')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete homework'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}
