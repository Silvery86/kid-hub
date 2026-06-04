import 'server-only'

import { z } from 'zod'
import {
  KID_PATTERN_LENGTH,
  PIN_LENGTH,
} from '@/lib/constants'

// ── Common ────────────────────────────────────────────────────────────────────

/** Non-empty string used as a database record ID. */
export const IdSchema = z.string().min(1)

/** Date in YYYY-MM-DD format. */
export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

/** Time in HH:MM format. */
export const TimeStringSchema = z.string().regex(/^\d{2}:\d{2}$/)

// ── Auth ──────────────────────────────────────────────────────────────────────

export const ParentEmailSchema = z.string().trim().toLowerCase().email('Invalid email format')

export const ParentPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')

export const ParentPinSchema = z
  .string()
  .regex(/^\d{4}$/, `PIN must be exactly ${PIN_LENGTH} digits`)

export const KidPatternSchema = z
  .string()
  .regex(new RegExp(`^[1-6]{${KID_PATTERN_LENGTH}}$`), 'Invalid unlock pattern format')

// ── Schedule ──────────────────────────────────────────────────────────────────

export const DayOfWeekSchema = z.enum([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
])

export const CreatePeriodSchema = z.object({
  day: DayOfWeekSchema,
  periodNumber: z.number().int().min(1).max(10),
  subjectId: z.string().min(1),
  startTime: TimeStringSchema,
  endTime: TimeStringSchema,
  roomNumber: z.string().optional(),
})

export const CreateExtraClassSchema = z.object({
  day: DayOfWeekSchema,
  subjectId: z.string().min(1),
  startTime: TimeStringSchema,
  endTime: TimeStringSchema,
  iconKey: z.string().max(30).optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export const UpdatePeriodSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1).optional(),
  startTime: TimeStringSchema.optional(),
  endTime: TimeStringSchema.optional(),
  roomNumber: z.string().optional(),
  iconKey: z.string().max(30).optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export const AddDailyHomeworkSchema = z.object({
  date: DateStringSchema,
  subjectId: z.string().min(1),
  label: z.string().min(1).max(150),
  iconKey: z.string().max(30).optional(),
  points: z.number().int().min(1).max(50).optional(),
})

export const ToggleHomeworkDoneSchema = z.object({
  id: IdSchema,
  isDone: z.boolean(),
})

// ── Grades ────────────────────────────────────────────────────────────────────

export const UpsertGradeSchema = z.object({
  subjectId: z.string().min(1),
  score: z.number().min(0).max(10),
  semester: z.union([z.literal(1), z.literal(2)]),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/),
})

// ── Games ─────────────────────────────────────────────────────────────────────

const GameLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

const GameSessionBaseSchema = z.object({
  level: GameLevelSchema,
  correctCount: z.number().int().min(0).max(10),
  incorrectCount: z.number().int().min(0).max(10),
  timeSpentSecs: z.number().int().min(1).max(600),
  homeworkPeriodId: z.string().optional(),
  homeworkDate: DateStringSchema.optional(),
})

export const SaveMathProgressSchema = GameSessionBaseSchema.extend({
  minigame: z.enum(['counting', 'addition', 'shapes']),
})

export const SaveEnglishProgressSchema = GameSessionBaseSchema.extend({
  minigame: z.enum(['alphabet', 'vocabulary', 'phonics']),
})

// ── Progress & Rewards ────────────────────────────────────────────────────────

export const AwardSchema = z.object({
  userId: z.string().min(1),
  points: z.number().int().min(1).max(50),
})

// ── Screen time ───────────────────────────────────────────────────────────────

/** Seconds added per screen-time heartbeat (1–120 s). */
export const ScreenTimeSecsSchema = z.number().int().min(1).max(120)

/** Daily screen time limit in minutes (30–480 min). */
export const ScreenTimeLimitSchema = z.number().int().min(30).max(480)

// ── Settings ──────────────────────────────────────────────────────────────────

export const KidAccessSettingsSchema = z.record(z.string(), z.boolean())
