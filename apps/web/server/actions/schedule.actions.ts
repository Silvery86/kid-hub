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
import type {
  DayOfWeek,
  DailyHomework,
  DailySchedule,
  TodayView,
  SchoolBreak,
  WeekSchedule,
  ActionResult,
  ActionVoidResult,
} from '@/types'
import type { StoredBellSchedule } from '@/server/services/schedule.service'
import { MAX_EVENING_BLOCKS_PER_DAY } from '@/lib/constants'
import {
  CreatePeriodSchema,
  CreateExtraClassSchema,
  UpdatePeriodSchema,
  AddDailyHomeworkSchema,
  SaveBellScheduleSchema,
  WeekStartSchema,
  SaveWeekScheduleSchema,
  CopyWeekSchema,
  SaveSchoolBreakSchema,
  VN_HOLIDAYS_2026_2027,
  findBreakForDate,
  isWholeWeekOff,
  dateOfWeekday,
  isPeriodClosed,
  nowInSchoolZone,
  diffWeek,
  isPastWeek,
  weekStartOfToday,
  weekStartsBetween,
  findRuleIssues,
  generateSlots,
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

/**
 * Reads one week of school periods, with the provenance the grid needs.
 *
 * An out-of-range or non-Monday week is rejected by the schema rather than
 * silently snapped to a Monday: snapping would show the parent a week they did
 * not ask for and then save into it.
 */
export const getWeekScheduleAction = async (
  weekStartDate?: string
): Promise<ActionResult<WeekSchedule>> => {
  try {
    const studentId = await resolveStudentContext()
    const week = weekStartDate ?? weekStartOfToday()
    const parsed = WeekStartSchema.safeParse(week)
    if (!parsed.success) return { success: false, error: 'Tuần không hợp lệ' }
    const data = await scheduleService.getWeekSchedule(studentId, parsed.data)
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

    const [schoolResult, eveningBlocks, cancelledIds, homework, bell, breaks] =
      await Promise.all([
        dow ? scheduleService.getDaySchedule(studentId, dow) : Promise.resolve(null),
        dow ? scheduleService.getEveningBlocks(studentId, dow) : Promise.resolve([]),
        scheduleService.getOverridesForDate(studentId, date),
        scheduleService.getDailyHomework(studentId, date),
        scheduleService.getBellSchedule(studentId),
        scheduleService.listSchoolBreaks(studentId),
      ])

    // Nghỉ lễ or nghỉ hè replaces the timetable; học hè and homework survive it.
    const activeBreak = findBreakForDate(breaks, date)

    // Only the non-lesson slots: the periods themselves already arrive as
    // ClassPeriods carrying their own times.
    const todayBellSlots = (bell?.slots ?? []).filter(
      (slot) => slot.kind !== 'PERIOD' && (!dow || slot.days.includes(dow))
    )

    const todayView = buildTodayView(
      date,
      schoolResult?.periods ?? [],
      eveningBlocks,
      cancelledIds,
      homework,
      todayBellSlots,
      activeBreak
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
    // A single period still has to land in a week; without one the CHECK
    // constraint rejects the row rather than storing a period no reader sees.
    const weekStartDate = data.weekStartDate ?? weekStartOfToday()
    const existing = await scheduleService.getDaySchedule(
      studentId,
      data.day as DayOfWeek,
      weekStartDate
    )
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
      weekStartDate,
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
): Promise<ActionResult<{ points: number; newBadgeIds: string[] }>> => {
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

    let newBadgeIds: string[] = []
    if (parsed.data.isDone) {
      const subj = getSubjectById(updated.subjectId)
      const icon = subj?.icon ?? '📝'
      void recordActivity(studentId, 'HOMEWORK_DONE', updated.label, icon)
      const newStreak = await updateStreak(studentId)
      await addUserPoints(studentId, updated.points)
      // Awaited now: fired with `void`, the streak badge could be cut short by a
      // frozen serverless function, and its ids could never reach the child.
      newBadgeIds = await checkAndAwardStreakBadges(studentId, newStreak)
    }

    return {
      success: true,
      data: { points: isDone ? updated.points : 0, newBadgeIds },
    }
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

// ── Bell schedule mutations ───────────────────────────────────

/** Reads the stored bell schedule for the active student, or null if unset. */
/** Lesson variants this household has already typed, for the week grid's chips. */
export const getRememberedVariantsAction = async (): Promise<
  ActionResult<Record<string, string[]>>
> => {
  try {
    const studentId = await resolveActiveStudent()
    return { success: true, data: await scheduleService.rememberedVariants(studentId) }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load variants'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

export const getBellScheduleAction = async (): Promise<ActionResult<StoredBellSchedule | null>> => {
  try {
    const studentId = await resolveActiveStudent()
    return { success: true, data: await scheduleService.getBellSchedule(studentId) }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load bell schedule'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/**
 * Saves the school's bell rules and the timeline derived from them.
 *
 * Rules that cannot produce a sane timeline are rejected with the generator's
 * own explanation rather than silently clamped — a recess anchored before its
 * period ends means the parent mistyped a rule, and only they know which.
 */
export const saveBellScheduleAction = async (input: unknown): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = SaveBellScheduleSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const { rules, presetKey } = parsed.data

    const issues = findRuleIssues(rules)
    if (issues.length > 0) {
      return { success: false, error: issues[0]!.message }
    }

    await scheduleService.saveBellSchedule(
      studentId,
      rules,
      generateSlots(rules),
      presetKey
    )
    revalidatePath('/dashboard')
    revalidatePath('/schedule')
    revalidatePath('/parent')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save bell schedule'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/**
 * Saves one week in one transaction.
 *
 * Times are never sent by the client — they come from the stored bell schedule,
 * which is the point of entering rules once. A household with no bell schedule
 * is told to set one rather than being asked for 70 clock times.
 *
 * The diff is taken against the week's OWN rows, not the rows on screen. When
 * the parent is looking at an inherited week those two differ: every cell is
 * new, so the save materialises the week and the inheritance stops there —
 * which is exactly what "edit that week only" has to mean.
 */
export const saveWeeklyScheduleAction = async (input: unknown): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = SaveWeekScheduleSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const { weekStartDate, applyTo, cells } = parsed.data

    // A week that has already happened is a record of what the child did, not a
    // draft. Checked on the server too: the grid hides the button, but the
    // action is the thing that writes.
    if (isPastWeek(weekStartDate, weekStartOfToday())) {
      return { success: false, error: 'Tuần đã qua — không thể chỉnh sửa' }
    }

    const bell = await scheduleService.getBellSchedule(studentId)
    if (!bell) {
      return { success: false, error: 'Hãy thiết lập khung giờ tiết học trước' }
    }

    // Two diffs, against two different baselines, because they answer two
    // different questions.
    const [own, effective] = await Promise.all([
      scheduleService.getOwnWeekSchedule(studentId, weekStartDate),
      scheduleService.getWeekSchedule(studentId, weekStartDate),
    ])

    // What to write: against the week's OWN rows. On an inherited week that is
    // empty, so the save materialises the week (§12.2).
    const diff = diffWeek(own, cells)

    // What actually CHANGED: against what the parent was looking at. These
    // differ on an inherited week, where materialising writes all five days —
    // including days already past. Creating Monday with the content Monday
    // already displayed rewrites no history, so checking the write diff here
    // would make an inherited week impossible to materialise mid-week.
    const changed = diffWeek(effective.days, cells)

    const slotOfRow = new Map<string, { day: DayOfWeek; periodNumber: number }>()
    for (const daySchedule of effective.days) {
      for (const period of daySchedule.periods) {
        if (period.id && period.periodNumber != null) {
          slotOfRow.set(period.id, { day: daySchedule.day, periodNumber: period.periodNumber })
        }
      }
    }
    const touched: { day: DayOfWeek; periodNumber: number }[] = [
      ...changed.created.map((c) => ({ day: c.day, periodNumber: c.periodNumber })),
      ...changed.updated.map((c) => ({ day: c.day, periodNumber: c.periodNumber })),
      ...changed.deleted.flatMap((id) => {
        const slot = slotOfRow.get(id)
        return slot ? [slot] : []
      }),
    ]

    // A lesson that has started is a record of what happened, not a plan.
    // Enforced here as well as in the grid, because the grid disabling a cell is
    // a convenience and not a rule — and resolved in the school's timezone,
    // because this process runs in UTC and would otherwise think the afternoon
    // had not begun.
    const now = nowInSchoolZone()
    const blocked = touched.some((slot) => {
      const times = scheduleService.resolveSlotTimes(bell.slots, slot.periodNumber, slot.day)
      // A cell the bell schedule cannot place is rejected below on its own terms.
      if (!times) return false
      return isPeriodClosed(
        dateOfWeekday(weekStartDate, slot.day),
        times.startTime,
        now.dateIso,
        now.minutes
      )
    })
    if (blocked) {
      return { success: false, error: 'Tiết học đã bắt đầu — không thể sửa nữa' }
    }

    // Resolving here rather than in the repository keeps the write layer free of
    // business rules, and surfaces a cell the bell schedule cannot place.
    const withTimes = <T extends { day: DayOfWeek; periodNumber: number }>(cell: T) => {
      const times = scheduleService.resolveSlotTimes(bell.slots, cell.periodNumber, cell.day)
      return times ? { ...cell, ...times } : null
    }

    const created = diff.created.map(withTimes)
    const updated = diff.updated.map(withTimes)
    if (created.includes(null) || updated.includes(null)) {
      return { success: false, error: 'Khung giờ chưa có tiết này — hãy cập nhật khung giờ' }
    }

    await scheduleService.replaceWeeklySchedule(
      studentId,
      weekStartDate,
      created as NonNullable<(typeof created)[number]>[],
      updated as NonNullable<(typeof updated)[number]>[],
      diff.deleted,
      applyTo === 'week'
    )

    revalidatePath('/dashboard')
    revalidatePath('/schedule')
    revalidatePath('/parent')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save weekly schedule'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/**
 * Counts what a copy would do, without doing it.
 *
 * The parent sees "12 tuần, trong đó 3 tuần đã có thời khóa biểu riêng" before
 * anything is written. Overwriting weeks they have deliberately customised is
 * the one destructive thing this feature can do, so it is never the result of a
 * single unqualified click.
 */
export const previewCopyWeekAction = async (
  input: unknown
): Promise<
  ActionResult<{ targetWeeks: string[]; weeksWithOwnRows: string[]; breakWeeks: string[] }>
> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = CopyWeekSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const { fromWeek, throughWeek } = parsed.data
    const spanned = weekStartsBetween(fromWeek, throughWeek)

    // A week the child spends at home does not need a timetable written into
    // it, and giving it rows of its own would stop it inheriting a later
    // correction. Reported, never silently dropped.
    const breaks = await scheduleService.listSchoolBreaks(studentId)
    const breakWeeks = spanned.filter((week) => isWholeWeekOff(breaks, week))
    const targetWeeks = spanned.filter((week) => !breakWeeks.includes(week))

    const weeksWithOwnRows = await scheduleService.findWeeksWithOwnRows(studentId, targetWeeks)
    return { success: true, data: { targetWeeks, weeksWithOwnRows, breakWeeks } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to preview copy'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/**
 * Copies this week's timetable into the weeks that follow it.
 *
 * Only needed to *pin* later weeks: without it they already inherit this one
 * (§12.2). It earns its place when the parent wants weeks frozen as they are
 * today before changing something later in the term.
 */
export const copyWeekAction = async (
  input: unknown
): Promise<
  ActionResult<{ weeksWritten: number; weeksSkipped: number; weeksOnBreak: number }>
> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = CopyWeekSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const { fromWeek, throughWeek, overwrite } = parsed.data

    const currentWeek = weekStartOfToday()
    if (isPastWeek(fromWeek, currentWeek)) {
      return { success: false, error: 'Tuần đã qua — không thể chỉnh sửa' }
    }

    const spanned = weekStartsBetween(fromWeek, throughWeek)
    // Copying backwards is impossible by construction (weekStartsBetween only
    // goes forward), so no past week can be rewritten by this path.
    if (spanned.length === 0) {
      return { success: false, error: 'Không có tuần nào để sao chép' }
    }

    const breaks = await scheduleService.listSchoolBreaks(studentId)
    const breakWeeks = spanned.filter((week) => isWholeWeekOff(breaks, week))
    const allTargets = spanned.filter((week) => !breakWeeks.includes(week))
    if (allTargets.length === 0) {
      return { success: false, error: 'Các tuần này đều là kỳ nghỉ' }
    }

    const skipWeeks = overwrite
      ? []
      : await scheduleService.findWeeksWithOwnRows(studentId, allTargets)

    const result = await scheduleService.copyWeekInto(
      studentId,
      fromWeek,
      allTargets,
      skipWeeks
    )
    if (result.weeksWritten === 0 && skipWeeks.length === 0) {
      return { success: false, error: 'Tuần này chưa có thời khóa biểu để sao chép' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/schedule')
    revalidatePath('/parent')
    return {
      success: true,
      data: {
        weeksWritten: result.weeksWritten,
        weeksSkipped: skipWeeks.length,
        weeksOnBreak: breakWeeks.length,
      },
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to copy week'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}


// ── School break mutations ───────────────────────────────────

/** Every holiday and nghỉ hè for the active student, earliest first. */
export const getSchoolBreaksAction = async (): Promise<ActionResult<SchoolBreak[]>> => {
  try {
    const studentId = await resolveStudentContext()
    return { success: true, data: await scheduleService.listSchoolBreaks(studentId) }
  } catch {
    return { success: false, error: 'Không tải được danh sách ngày nghỉ' }
  }
}

/** Creates or updates one break. An `id` in the payload means update. */
export const saveSchoolBreakAction = async (input: unknown): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = SaveSchoolBreakSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }
    const { id, ...data } = parsed.data
    if (id) await scheduleService.updateSchoolBreak(studentId, { ...data, id })
    else await scheduleService.createSchoolBreak(studentId, data)

    revalidatePath('/dashboard')
    revalidatePath('/schedule')
    revalidatePath('/parent')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Không lưu được ngày nghỉ'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/** Deletes one break. */
export const deleteSchoolBreakAction = async (id: string): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = z.string().min(1).safeParse(id)
    if (!parsed.success) return { success: false, error: 'Invalid ID' }
    await scheduleService.deleteSchoolBreak(parsed.data, studentId)

    revalidatePath('/dashboard')
    revalidatePath('/schedule')
    revalidatePath('/parent')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Không xóa được ngày nghỉ'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/**
 * Adds the shipped Vietnamese holidays the student does not already have.
 *
 * Explicit, never automatic: a parent who deleted Giỗ Tổ because their school
 * teaches that day should not find it back tomorrow. Re-running is safe — the
 * (studentId, presetKey) unique means a corrected Tết is never overwritten.
 */
export const addHolidayPresetsAction = async (): Promise<ActionResult<{ added: number }>> => {
  try {
    const studentId = await resolveActiveStudent()
    const added = await scheduleService.seedHolidayPresets(studentId, VN_HOLIDAYS_2026_2027)

    revalidatePath('/dashboard')
    revalidatePath('/schedule')
    revalidatePath('/parent')
    return { success: true, data: { added } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Không thêm được ngày lễ'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/**
 * Moves the child up a grade after a summer break, on the parent's say-so.
 *
 * Nothing here runs on a schedule. `pendingPromotion` decides when the question
 * is worth asking; this is the answer being recorded. A child repeating a year
 * is handled by the parent having set the same grade on the break, so this path
 * needs no special case for it.
 */
export const applyGradePromotionAction = async (
  breakId: string
): Promise<ActionResult<{ gradeLevel: number }>> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = z.string().min(1).safeParse(breakId)
    if (!parsed.success) return { success: false, error: 'Invalid ID' }

    const result = await scheduleService.applyGradePromotion(studentId, parsed.data)
    if (!result.applied || result.gradeLevel == null) {
      return { success: false, error: 'Kỳ nghỉ này đã chuyển lớp rồi' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/schedule')
    revalidatePath('/parent')
    return { success: true, data: { gradeLevel: result.gradeLevel } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Không chuyển lớp được'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}
