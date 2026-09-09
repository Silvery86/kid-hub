// Zod schemas for schedule mutations — isomorphic (Web actions + Mobile REST).
import { z } from 'zod'

export const DaySchema = z.enum([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
])

export const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/)

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
