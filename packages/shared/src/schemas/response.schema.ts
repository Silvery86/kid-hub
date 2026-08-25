// Zod schemas for the RESPONSE payloads returned by /api/v1 routes — isomorphic.
//
// These describe the JSON shape carried over the wire (after serialization), so
// date fields are validated as ISO `z.string()`, matching what a client actually
// receives. The mobile api-client parses responses against these (see
// packages/api-client) so a server-side shape change that the contract types
// missed surfaces as a clear error instead of a silent runtime break.
//
// Each schema is kept in sync with its contract type in ../types via bidirectional
// type-assignability checks in response.schema.test.ts.
import { z } from 'zod'
import { DaySchema } from './schedule.schema'

// ── Shared primitives ────────────────────────────────────────────────────────

/** DifficultyLevel — 1 | 2 | 3. */
export const DifficultyLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

/** Stars earned — 1 | 2 | 3. */
export const StarsEarnedSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

/** GameType — 'math' | 'english'. */
export const GameTypeSchema = z.enum(['math', 'english'])

/** BadgeTier — 'excellent' | 'good' | 'needs-practice'. */
export const BadgeTierSchema = z.enum(['excellent', 'good', 'needs-practice'])

/** EventType — 'SCHOOL_PERIOD' | 'EXTRA_CLASS'. */
export const EventTypeSchema = z.enum(['SCHOOL_PERIOD', 'EXTRA_CLASS'])

// ── Building blocks ──────────────────────────────────────────────────────────

/** ClassPeriod — matches the ClassPeriod interface in ../types/schedule. */
export const ClassPeriodSchema = z.object({
  id: z.string().optional(),
  periodNumber: z.number().int().optional(),
  eventType: EventTypeSchema.optional(),
  subjectId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  roomNumber: z.string().optional(),
  iconKey: z.string().optional(),
  sortOrder: z.number().int().optional(),
})

/** DailyHomework — matches the DailyHomework interface in ../types/schedule. */
export const DailyHomeworkSchema = z.object({
  id: z.string(),
  date: z.string(),
  subjectId: z.string(),
  label: z.string(),
  iconKey: z.string().optional(),
  isDone: z.boolean(),
  doneAt: z.string().optional(),
  points: z.number().int(),
})

/** SubjectGrade — matches the SubjectGrade interface in ../types/grades. */
export const SubjectGradeSchema = z.object({
  subjectId: z.string(),
  score: z.number(),
  badge: BadgeTierSchema,
  semester: z.union([z.literal(1), z.literal(2)]),
  academicYear: z.string(),
})

// ── Endpoint response payloads ───────────────────────────────────────────────

/** GET /api/v1/schedule — TodayView. */
export const TodayViewSchema = z.object({
  date: z.string(),
  schoolPeriods: z.array(ClassPeriodSchema),
  eveningBlocks: z.array(ClassPeriodSchema),
  cancelledIds: z.array(z.string()),
  homework: z.array(DailyHomeworkSchema),
})

/** DailySchedule — one weekday's periods. */
export const DailyScheduleSchema = z.object({
  day: DaySchema,
  periods: z.array(ClassPeriodSchema),
})

/**
 * GET /api/v1/schedule/week — the full timetable plus every extra-class block,
 * both keyed by weekday. Feeds the schedule screen's day tabs, which cannot be
 * built from TodayView.
 */
export const WeekViewSchema = z.object({
  days: z.array(DailyScheduleSchema),
  eveningBlocks: z.array(DailyScheduleSchema),
})

/** POST /api/v1/auth/pin — the outcome of one PIN attempt. */
export const PinVerifySchema = z.object({
  status: z.enum(['ok', 'wrong', 'locked', 'not-configured']),
  lockoutSeconds: z.number().optional(),
})

/** GET /api/v1/kid-access — saved toggles, or null when never customised. */
export const KidAccessSettingsSchema = z.record(z.string(), z.boolean()).nullable()

/** GET /api/v1/screen-time — today's usage against the configured limit. */
export const ScreenTimeSchema = z.object({
  usedSecs: z.number(),
  limitMins: z.number(),
})

/** GET /api/v1/activity — recent kid activity, newest first. */
export const ActivityItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  iconKey: z.string().nullable(),
  createdAt: z.string(),
})
export const ActivityItemArraySchema = z.array(ActivityItemSchema)

/** Write endpoints answer with a small acknowledgement rather than the row. */
export const MutationAckSchema = z.object({
  id: z.string().optional(),
  saved: z.boolean().optional(),
  deleted: z.boolean().optional(),
  cancelled: z.boolean().optional(),
  restored: z.boolean().optional(),
  recorded: z.boolean().optional(),
})

/** GET /api/v1/auth/kid-pattern — whether a parent has configured the pattern. */
export const KidPatternStatusSchema = z.object({
  hasKidPatternSet: z.boolean(),
})

/**
 * POST /api/v1/auth/kid-pattern — the outcome of one attempt.
 * A wrong pattern is a successful request with a 'wrong' result, not an HTTP
 * error: the client renders all four outcomes the same way.
 */
export const KidPatternVerifySchema = z.object({
  status: z.enum(['ok', 'wrong', 'locked', 'not-configured']),
  lockoutSeconds: z.number().optional(),
})

/** GET /api/v1/kid-profile — the kid's display name and grade. */
export const KidProfileSchema = z.object({
  name: z.string(),
  gradeLevel: z.number().int(),
})

/** GET /api/v1/homework/today — HomeworkItem[]. */
export const HomeworkItemSchema = z.object({
  periodId: z.string(),
  subjectId: z.string(),
  homeworkNote: z.string(),
  startTime: z.string(),
  isDone: z.boolean(),
  doneAt: z.string().optional(),
})
export const HomeworkItemArraySchema = z.array(HomeworkItemSchema)

/** GET /api/v1/grades — ReportCard. */
export const ReportCardSchema = z.object({
  userId: z.string(),
  grades: z.array(SubjectGradeSchema),
  averageScore: z.number(),
})

/** GET /api/v1/{math,english} — GameBestScore[]. */
export const GameBestScoreSchema = z.object({
  gameType: GameTypeSchema,
  level: DifficultyLevelSchema,
  score: z.number(),
  starsEarned: StarsEarnedSchema,
  achievedAt: z.string(),
  subType: z.string().optional(),
})
export const GameBestScoreArraySchema = z.array(GameBestScoreSchema)

/** POST /api/v1/{math,english} — GameSaveResult. */
export const GameSaveResultSchema = z.object({
  starsEarned: StarsEarnedSchema,
  score: z.number(),
  pointsEarned: z.number(),
  isNewBest: z.boolean(),
})

/** GET /api/v1/progress — flattened progress summary, or null when unset. */
export const ProgressSummarySchema = z
  .object({
    totalPoints: z.number(),
    currentStreak: z.number(),
    lastActiveDate: z.string(),
    earnedBadgeIds: z.array(z.string()),
    mathBestStars: z.number(),
    englishBestStars: z.number(),
  })
  .nullable()

/** Inferred type for the /progress payload (no hand-written contract type exists). */
export type ProgressSummary = z.infer<typeof ProgressSummarySchema>
