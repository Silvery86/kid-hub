'use server'

/**
 * Server Actions for weekly schedule: query and CRUD operations on class periods,
 * daily homework, and extra-class overrides.
 * All mutations are validated with Zod and guarded by parent session check.
 */

import { revalidatePath } from 'next/cache'
import { validatePeriodOverlap, buildTodayView, jsDateToDayOfWeek } from '@/server/services/schedule.service'
import * as scheduleRepo from '@/server/repositories/schedule.repository'
import { addPoints, incrementStreak } from '@/server/services/progress.service'
import { recordActivity } from '@/server/services/activity.service'
import { checkAndAwardStreakBadges } from '@/server/services/rewards.service'
import { requireParentSession } from '@/server/lib/auth-guard'
import { getSubjectById } from '@/lib/data/subjects'
import {
  IdSchema,
  DateStringSchema,
  DayOfWeekSchema,
  CreatePeriodSchema,
  CreateExtraClassSchema,
  UpdatePeriodSchema,
  AddDailyHomeworkSchema,
  ToggleHomeworkDoneSchema,
} from '@/server/lib/schemas'
import type { DayOfWeek, DailyHomework, DailySchedule, TodayView } from '@/types'
import { DEFAULT_USER_ID, MAX_EVENING_BLOCKS_PER_DAY } from '@/lib/constants'

const todayStr = (): string => new Date().toISOString().split('T')[0]!

// ── Read actions ──────────────────────────────────────────────

/** Retrieves all EXTRA_CLASS (evening) blocks for every day, grouped by day. */
export const getAllEveningBlocksAction = async (): Promise<{
  success: boolean
  data?: DailySchedule[]
  error?: string
}> => {
  try {
    const data = await scheduleRepo.getAllEveningBlocks(DEFAULT_USER_ID)
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to fetch evening blocks' }
  }
}

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

/** Retrieves homework items for a specific date (parent action). */
export const getDailyHomeworkByDateAction = async (
  date: string
): Promise<{ success: boolean; data?: DailyHomework[]; error?: string }> => {
  try {
    await requireParentSession()
    const parsed = DateStringSchema.safeParse(date)
    if (!parsed.success) return { success: false, error: 'Invalid date' }
    const data = await scheduleRepo.getDailyHomework(DEFAULT_USER_ID, parsed.data)
    return { success: true, data }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch daily homework'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
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
    await scheduleRepo.updatePeriod({ ...parsed.data, userId: DEFAULT_USER_ID })
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
    const parsed = IdSchema.safeParse(id)
    if (!parsed.success) return { success: false, error: 'Invalid period ID' }
    await scheduleRepo.deletePeriod(parsed.data, DEFAULT_USER_ID)
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
    const existing = await scheduleRepo.getEveningBlocks(DEFAULT_USER_ID, data.day as DayOfWeek)
    const overlaps = validatePeriodOverlap(
      {
        subjectId: data.subjectId,
        startTime: data.startTime,
        endTime: data.endTime,
      },
      existing
    )
    if (overlaps) {
      return { success: false, error: 'Khung giờ bị trùng với buổi học tối đã có' }
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
    const idParsed = IdSchema.safeParse(periodId)
    const dateParsed = DateStringSchema.safeParse(date)
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
    const parsed = ToggleHomeworkDoneSchema.safeParse({ id, isDone })
    if (!parsed.success) return { success: false, error: 'Invalid input' }
    const updated = await scheduleRepo.toggleDailyHomeworkDone(
      parsed.data.id,
      DEFAULT_USER_ID,
      parsed.data.isDone
    )
    revalidatePath('/schedule')

    if (parsed.data.isDone) {
      const subj = getSubjectById(updated.subjectId)
      const icon = subj?.icon ?? '📝'
      void recordActivity(DEFAULT_USER_ID, 'HOMEWORK_DONE', updated.label, icon)
      const newStreak = await incrementStreak(DEFAULT_USER_ID)
      await addPoints(DEFAULT_USER_ID, updated.points)
      void checkAndAwardStreakBadges(DEFAULT_USER_ID, newStreak)
    }

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
    const parsed = IdSchema.safeParse(id)
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
