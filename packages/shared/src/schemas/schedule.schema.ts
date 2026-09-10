// Zod schemas for schedule mutations — isomorphic (Web actions + Mobile REST).
import { z } from 'zod'

import { isIsoDate, weekStartOf } from '../domain/school-weeks'

export const DaySchema = z.enum([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
])

export const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/)

/**
 * The Monday a week of school periods is stored under, "YYYY-MM-DD".
 *
 * Refined rather than merely pattern-matched: a client that sends a Wednesday
 * would create a second, parallel "week" that no reader would ever resolve to,
 * and the row would simply disappear from the grid.
 */
export const WeekStartSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ')
  .refine(isIsoDate, 'Ngày không hợp lệ')
  .refine((value) => weekStartOf(value) === value, 'Tuần phải bắt đầu từ Thứ Hai')

/** "HH:MM" strings are zero-padded, so lexical order matches chronological order. */
const endsAfterStart = (v: { startTime?: string; endTime?: string }): boolean =>
  v.startTime == null || v.endTime == null || v.endTime > v.startTime

// Surfaced verbatim by the parent schedule UI, which reads issues[0].message.
const TIME_ORDER_ISSUE = {
  message: 'Giờ kết thúc phải sau giờ bắt đầu',
  path: ['endTime'],
}

export const CreatePeriodSchema = z
  .object({
    day: DaySchema,
    /** Which week the period belongs to. Defaults to the current week server-side. */
    weekStartDate: WeekStartSchema.optional(),
    periodNumber: z.number().int().min(1).max(10),
    subjectId: z.string().min(1),
    note: z.string().trim().max(40, 'Ghi chú tối đa 40 ký tự').optional(),
    startTime: TimeSchema,
    endTime: TimeSchema,
    roomNumber: z.string().optional(),
  })
  .refine(endsAfterStart, TIME_ORDER_ISSUE)

export const CreateExtraClassSchema = z
  .object({
    day: DaySchema,
    subjectId: z.string().min(1),
    startTime: TimeSchema,
    endTime: TimeSchema,
    iconKey: z.string().max(30).optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine(endsAfterStart, TIME_ORDER_ISSUE)

// Partial update: only enforced when the payload carries both ends of the range.
// A one-sided edit is checked against the stored row in schedule.actions.ts.
export const UpdatePeriodSchema = z
  .object({
    id: z.string().min(1),
    subjectId: z.string().min(1).optional(),
    note: z.string().trim().max(40, 'Ghi chú tối đa 40 ký tự').optional(),
    startTime: TimeSchema.optional(),
    endTime: TimeSchema.optional(),
    roomNumber: z.string().optional(),
    iconKey: z.string().max(30).optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine(endsAfterStart, TIME_ORDER_ISSUE)

export const AddDailyHomeworkSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  subjectId: z.string().min(1),
  label: z.string().min(1).max(150),
  iconKey: z.string().max(30).optional(),
  points: z.number().int().min(1).max(50).optional(),
})

// ── Bell schedule ────────────────────────────────────────────
// The rules a school publishes, validated on the way in. Structural sanity
// (a recess anchored before its period ends) is checked separately by
// findRuleIssues, which can explain the problem in terms of the timeline.

export const BellRecessSchema = z.object({
  afterPeriod: z.number().int().min(1).max(20),
  start: TimeSchema,
  minutes: z.number().int().min(1).max(120),
  label: z.string().trim().max(40).optional(),
})

export const BellSessionSchema = z.object({
  start: TimeSchema,
  periods: z.number().int().min(0).max(12),
  recess: BellRecessSchema.optional(),
})

export const BellRoutineSchema = z.object({
  label: z.string().trim().min(1, 'Cần đặt tên cho hoạt động').max(40),
  startTime: TimeSchema,
  endTime: TimeSchema,
  days: z.array(DaySchema).min(1, 'Chọn ít nhất một ngày'),
})

export const BellRulesSchema = z.object({
  periodMinutes: z.number().int().min(5, 'Mỗi tiết tối thiểu 5 phút').max(120),
  transitionMinutes: z.number().int().min(0).max(60),
  morning: BellSessionSchema,
  afternoon: BellSessionSchema.optional(),
  routines: z.array(BellRoutineSchema).max(10),
})

export const BellAnchorsSchema = z.object({
  morningEnd: TimeSchema.optional(),
  afternoonEnd: TimeSchema.optional(),
  dismissal: z.record(DaySchema, TimeSchema).optional(),
})

export const SaveBellScheduleSchema = z.object({
  presetKey: z.string().max(40).optional(),
  rules: BellRulesSchema,
  anchors: BellAnchorsSchema.optional(),
})

// ── Week-at-a-time save ──────────────────────────────────────

export const WeekCellSchema = z.object({
  day: DaySchema,
  periodNumber: z.number().int().min(1).max(20),
  subjectId: z.string().min(1),
  note: z.string().trim().max(40, 'Ghi chú tối đa 40 ký tự').optional(),
})

export const SaveWeekScheduleSchema = z.object({
  /** Which week these cells belong to. Every save names its week explicitly —
   *  a default here would let a stale tab write into the current week. */
  weekStartDate: WeekStartSchema,
  cells: z.array(WeekCellSchema).max(140),
}).superRefine((value, ctx) => {
  // Two cells claiming one slot would violate the unique constraint mid-write
  // and roll the whole week back. Catch it before the transaction opens.
  const seen = new Set<string>()
  for (const cell of value.cells) {
    const key = `${cell.day}-${cell.periodNumber}`
    if (seen.has(key)) {
      ctx.addIssue({
        code: 'custom',
        path: ['cells'],
        message: `Trùng tiết ${cell.periodNumber} trong cùng một ngày`,
      })
      return
    }
    seen.add(key)
  }
})

/**
 * Copy one week's timetable into later weeks.
 *
 * `throughWeek` is the last week to write, inclusive; the caller derives it
 * from the parent's choice ("tuần sau" or "đến hết học kỳ") so the server never
 * has to guess how long a semester is. Both ends are Mondays, so an off-by-one
 * cannot land rows in a week nothing reads.
 */
export const CopyWeekSchema = z
  .object({
    fromWeek: WeekStartSchema,
    throughWeek: WeekStartSchema,
    /** Weeks that already have their own rows are skipped unless this is set. */
    overwrite: z.boolean().default(false),
  })
  .refine((v) => v.throughWeek > v.fromWeek, {
    message: 'Chỉ sao chép được sang các tuần sau',
    path: ['throughWeek'],
  })
