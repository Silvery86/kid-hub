'use server'

/**
 * Server Actions for weekly schedule: query and CRUD operations on class periods,
 * daily homework, and extra-class overrides.
 * All mutations are validated with Zod and guarded by parent session check.
 */

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import {
  requireKidSession,
  resolveActiveStudent,
  resolveStudentContext,
} from '@/server/lib/auth-guard'
import { validatePeriodOverlap, buildTodayView, jsDateToDayOfWeek } from '@/server/services/schedule.service'
import * as scheduleService from '@/server/services/schedule.service'
import { addUserPoints, updateStreak } from '@/server/services/progress.service'
import { recordActivity } from '@/server/services/activity.service'
import { checkAndAwardStreakBadges } from '@/server/services/rewards.service'
import { getSubjectById } from '@/lib/data/subjects'
import type { DayOfWeek, DailyHomework, DailySchedule, TodayView, ActionResult, ActionVoidResult } from '@/types'
import { MAX_EVENING_BLOCKS_PER_DAY } from '@/lib/constants'
import {
  CreatePeriodSchema,
  CreateExtraClassSchema,
  UpdatePeriodSchema,
  AddDailyHomeworkSchema,
} from '@kid-hub/shared'

// Named schemas (CreatePeriodSchema, CreateExtraClassSchema, UpdatePeriodSchema,
// AddDailyHomeworkSchema) are owned by @kid-hub/shared (Phase 2) and imported above.
// Inline ad-hoc validations below still use `z` directly.

const todayStr = (): string => new Date().toISOString().split('T')[0]!

// ── Read actions ──────────────────────────────────────────────

/** Retrieves all EXTRA_CLASS (evening) blocks for every day, grouped by day. */
export const getAllEveningBlocksAction = async (): Promise<ActionResult<DailySchedule[]>> => {
  try {
    const studentId = await resolveStudentContext()
    const data = await scheduleService.getAllEveningBlocks(studentId)
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to fetch evening blocks' }
  }
}

/** Retrieves the weekly SCHOOL_PERIOD schedule, optionally filtered to a specific day. */
export const getScheduleAction = async (
  day?: DayOfWeek
): Promise<ActionResult<DailySchedule[]>> => {
  try {
    const studentId = await resolveStudentContext()
    if (day) {
      const result = await scheduleService.getDaySchedule(studentId, day)
      return { success: true, data: result ? [result] : [] }
    }
    const data = await scheduleService.getWeeklySchedule(studentId)
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to fetch schedule' }
  }
}

/** Builds a complete TodayView: school periods + evening blocks + overrides + homework. */
export const getTodayViewAction = async (): Promise<ActionResult<TodayView>> => {
  try {
    const studentId = await resolveStudentContext()
    const today = new Date()
    const date = todayStr()
    const dow = jsDateToDayOfWeek(today)

    const [schoolResult, eveningBlocks, cancelledIds, homework] = await Promise.all([
      dow ? scheduleService.getDaySchedule(studentId, dow) : Promise.resolve(null),
      dow ? scheduleService.getEveningBlocks(studentId, dow) : Promise.resolve([]),
      scheduleService.getOverridesForDate(studentId, date),
      scheduleService.getDailyHomework(studentId, date),
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
): Promise<ActionResult<DailyHomework[]>> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(date)
    if (!parsed.success) return { success: false, error: 'Invalid date' }
    const data = await scheduleService.getDailyHomework(studentId, parsed.data)
    return { success: true, data }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch daily homework'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

// ── School period mutations ───────────────────────────────────

/** Creates a new SCHOOL_PERIOD. Validates overlap and revalidates affected paths. */
export const createPeriodAction = async (input: unknown): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = CreatePeriodSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const data = parsed.data
    const existing = await scheduleService.getDaySchedule(studentId, data.day as DayOfWeek)
    const newPeriod = {
      periodNumber: data.periodNumber,
      subjectId: data.subjectId,
      startTime: data.startTime,
      endTime: data.endTime,
    }
    if (existing && validatePeriodOverlap(newPeriod, existing.periods)) {
      return { success: false, error: 'This time slot overlaps with an existing period' }
    }
    await scheduleService.createPeriod({
      ...data,
      studentId,
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
export const updatePeriodAction = async (input: unknown): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = UpdatePeriodSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    // A one-sided time edit passes the schema — check the merged range against the stored row.
    const { startTime, endTime } = parsed.data
    if ((startTime == null) !== (endTime == null)) {
      const stored = await scheduleService.getPeriodTimes(parsed.data.id, studentId)
      if (!stored) return { success: false, error: 'Period not found' }
      const merged = { start: startTime ?? stored.startTime, end: endTime ?? stored.endTime }
      if (merged.end <= merged.start) {
        return { success: false, error: 'Giờ kết thúc phải sau giờ bắt đầu' }
      }
    }
    await scheduleService.updatePeriod({ ...parsed.data, studentId })
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
export const deletePeriodAction = async (id: string): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = z.string().min(1).safeParse(id)
    if (!parsed.success) return { success: false, error: 'Invalid period ID' }
    await scheduleService.deletePeriod(parsed.data, studentId)
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
): Promise<ActionResult<{ id: string }>> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = CreateExtraClassSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const data = parsed.data
    const count = await scheduleService.countEveningBlocks(studentId, data.day as DayOfWeek)
    if (count >= MAX_EVENING_BLOCKS_PER_DAY) {
      return { success: false, error: `Tối đa ${MAX_EVENING_BLOCKS_PER_DAY} buổi học thêm mỗi ngày` }
    }
    const existing = await scheduleService.getEveningBlocks(studentId, data.day as DayOfWeek)
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
    const id = await scheduleService.createPeriod({
      ...data,
      studentId,
      day: data.day as DayOfWeek,
      eventType: 'EXTRA_CLASS',
    })
    revalidatePath('/schedule')
    return { success: true, data: { id } }
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
): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const idParsed = z.string().min(1).safeParse(periodId)
    const dateParsed = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(date)
    if (!idParsed.success || !dateParsed.success) {
      return { success: false, error: 'Invalid input' }
    }
    await scheduleService.createOverride(periodId, studentId, date, reason)
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
): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    await scheduleService.deleteOverride(periodId, studentId, date)
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
): Promise<ActionResult<{ id: string }>> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = AddDailyHomeworkSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const id = await scheduleService.createDailyHomework({
      ...parsed.data,
      studentId,
    })
    revalidatePath('/schedule')
    return { success: true, data: { id } }
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
): Promise<ActionResult<{ points: number }>> => {
  try {
    const parsed = z.object({ id: z.string().min(1), isDone: z.boolean() }).safeParse({ id, isDone })
    if (!parsed.success) return { success: false, error: 'Invalid input' }
    const { studentId } = await requireKidSession()
    const updated = await scheduleService.toggleDailyHomeworkDone(
      parsed.data.id,
      studentId,
      parsed.data.isDone
    )
    revalidatePath('/schedule')

    if (parsed.data.isDone) {
      const subj = getSubjectById(updated.subjectId)
      const icon = subj?.icon ?? '📝'
      void recordActivity(studentId, 'HOMEWORK_DONE', updated.label, icon)
      const newStreak = await updateStreak(studentId)
      await addUserPoints(studentId, updated.points)
      void checkAndAwardStreakBadges(studentId, newStreak)
    }

    return { success: true, data: { points: isDone ? updated.points : 0 } }
  } catch {
    return { success: false, error: 'Failed to update homework' }
  }
}

/** Deletes a daily homework item (parent action). */
export const deleteDailyHomeworkAction = async (id: string): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = z.string().min(1).safeParse(id)
    if (!parsed.success) return { success: false, error: 'Invalid ID' }
    await scheduleService.deleteDailyHomework(parsed.data, studentId)
    revalidatePath('/schedule')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete homework'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}
