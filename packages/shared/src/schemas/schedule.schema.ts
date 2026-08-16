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
