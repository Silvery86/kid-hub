// Schedule domain — cross-platform contract types (Web + Mobile).
// Owner: @kid-hub/shared. apps/web re-exports these; apps/mobile imports them.

// ── Day of week ──────────────────────────────────────────────
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type EventType = 'SCHOOL_PERIOD' | 'EXTRA_CLASS'
export type TimeBand = 'morning' | 'afternoon' | 'evening'

export interface ClassPeriod {
  id?: string
  periodNumber?: number   // 1–10 for SCHOOL_PERIOD; absent for EXTRA_CLASS
  eventType?: EventType
  subjectId: string
  startTime: string       // "HH:MM" 24-hour format
  endTime: string         // "HH:MM" 24-hour format
  roomNumber?: string
  iconKey?: string
  sortOrder?: number
}

export interface DailyHomework {
  id: string
  date: string            // "YYYY-MM-DD"
  subjectId: string
  label: string
  iconKey?: string
  isDone: boolean
  doneAt?: string         // ISO date string
  points: number
}

export interface ExtraClassOverride {
  id: string
  periodId: string
  date: string            // "YYYY-MM-DD"
  reason?: string
}

export interface DailySchedule {
  day: DayOfWeek
  periods: ClassPeriod[]
}

export interface WeeklySchedule {
  weekStartDate: string   // ISO date "YYYY-MM-DD"
  days: DailySchedule[]
}

/** @deprecated Use DailyHomework. Kept for backward compat with DashboardView. */
export interface HomeworkItem {
  periodId: string   // maps to DailyHomework.id
  subjectId: string
  homeworkNote: string  // maps to DailyHomework.label
  startTime: string     // empty string — not applicable to DailyHomework
  isDone: boolean
  doneAt?: string
}

export interface TodayView {
  date: string            // "YYYY-MM-DD"
  schoolPeriods: ClassPeriod[]
  eveningBlocks: ClassPeriod[]   // EXTRA_CLASS entries, cancelled ones filtered out
  cancelledIds: string[]         // periodIds skipped today via ExtraClassOverride
  homework: DailyHomework[]
}

export interface Subject {
  id: string
  name: string
  colorClass: string // Tailwind bg class e.g. "bg-blue-400"
  iconName: string // lucide-react icon name
  color: string // hex — PeriodCell tinting via color-mix
  icon: string // emoji — schedule grid / list
}

/**
 * GET /api/v1/schedule/week — the whole timetable plus every extra-class block,
 * both grouped by weekday. The schedule screen's day tabs need the full week,
 * which `TodayView` cannot provide.
 */
export interface WeekView {
  days: DailySchedule[]
  eveningBlocks: DailySchedule[]
}

/** GET /api/v1/kid-profile — the kid's display name and grade. */
export interface KidProfile {
  name: string
  gradeLevel: number
}

/** GET /api/v1/auth/kid-pattern — whether a parent has configured the pattern. */
export interface KidPatternStatus {
  hasKidPatternSet: boolean
}

/** POST /api/v1/auth/kid-pattern — the outcome of one unlock attempt. */
export interface KidPatternVerify {
  status: 'ok' | 'wrong' | 'locked' | 'not-configured'
  lockoutSeconds?: number
}

/** POST /api/v1/auth/pin — the outcome of one PIN attempt. */
export interface PinVerify {
  status: 'ok' | 'wrong' | 'locked' | 'not-configured'
  lockoutSeconds?: number
}

/** GET /api/v1/kid-access — saved toggles, or null when never customised. */
export type KidAccessSettings = Record<string, boolean> | null

/** GET /api/v1/screen-time — today's usage against the configured limit. */
export interface ScreenTime {
  usedSecs: number
  limitMins: number
}

/** GET /api/v1/activity — one recent kid activity event. */
export interface ActivityItem {
  id: string
  type: string
  label: string
  iconKey: string | null
  createdAt: string
}

/** Acknowledgement returned by the parent write endpoints. */
export interface MutationAck {
  id?: string
  saved?: boolean
  deleted?: boolean
  cancelled?: boolean
  restored?: boolean
  recorded?: boolean
}
