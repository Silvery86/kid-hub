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

// ── Bell schedule ────────────────────────────────────────────
// The school's published rules, and the day timeline derived from them.
// See docs/SCHEDULE_PARENT_IMP.md §6.

/**
 * PERIOD is a numbered tiết and the only kind that accepts a subject.
 * BREAK is ra chơi. ROUTINE is everything else a school day contains —
 * arrival, ăn trưa & ngủ, the guided hour — which is most of a first
 * grader's day and was previously unrepresentable.
 */
export type SlotKind = 'PERIOD' | 'BREAK' | 'ROUTINE'

export interface BellSlot {
  id?: string
  kind: SlotKind
  /** Set only when kind is PERIOD. Numbered across the whole day, not per session. */
  periodNumber?: number
  /** Shown for BREAK and ROUTINE; a PERIOD is labelled by its subject instead. */
  label?: string
  startTime: string
  endTime: string
  /** Which weekdays this slot occurs on. Friday omits the guided hour, hence per-slot. */
  days: DayOfWeek[]
  /** False once a parent has hand-edited it, so regenerating will not clobber the fix. */
  isGenerated: boolean
}

/** A recess, pinned to the clock time the school published rather than an offset. */
export interface BellRecess {
  /** The (global) period number this recess follows. */
  afterPeriod: number
  /** Absolute start, e.g. "09:30" — absorbs whatever slack the school leaves. */
  start: string
  minutes: number
  label?: string
}

export interface BellSession {
  /** When the first period of this session begins, e.g. "08:10". */
  start: string
  periods: number
  recess?: BellRecess
}

export interface BellRoutine {
  label: string
  startTime: string
  endTime: string
  days: DayOfWeek[]
}

/** Everything a school publishes about its day, in the shape it publishes it. */
export interface BellRules {
  periodMinutes: number
  /** Gap between consecutive periods for the children to swap books. */
  transitionMinutes: number
  morning: BellSession
  /** Absent for a morning-only school. */
  afternoon?: BellSession
  /**
   * Bán trú — the child stays at school over midday to eat and nap.
   *
   * This is a fact about the enrolment, not the timetable, and it decides which
   * times the parent actually needs. A boarding child never crosses the morning
   * dismissal, so the number that matters is giờ tan học at the end of the day.
   * A non-boarding child is collected when the morning ends and brought back
   * for the afternoon, making that same morning end a real pickup time.
   *
   * It also decides whether the midday gap is time at school, which is why the
   * lunch break is derived from this flag rather than typed in as a routine.
   */
  boarding: boolean
  routines: BellRoutine[]
}

/**
 * Where a subject sits in the picker for one grade.
 *
 * `required` and `elective` come from the programme; `extra` is the blocks a
 * school prints that no thông tư names — thư viện, hướng dẫn học.
 */
export type SubjectBand = 'required' | 'elective' | 'extra'

/**
 * A subject a parent added because their school teaches it and the national
 * programme does not name it — "Toán tiếng Anh", a robotics club.
 */
export interface CustomSubjectRow {
  /** "custom_<cuid>" — permanent, survives a rename. */
  subjectId: string
  name: string
  color: string
  icon: string
}

/** One `<optgroup>`: a heading and the subjects under it. */
export interface SubjectGroup {
  label: string
  subjects: Subject[]
}

/** Giờ tan học for a run of weekdays that all end at the same time. */
export interface DismissalGroup {
  days: DayOfWeek[]
  time: string
}

/** A rule set that cannot produce a sane timeline. */
export interface RuleIssue {
  field: string
  message: string
}
export type TimeBand = 'morning' | 'afternoon' | 'evening'

export interface ClassPeriod {
  id?: string
  periodNumber?: number   // 1–10 for SCHOOL_PERIOD; absent for EXTRA_CLASS
  /**
   * Monday of the week this row belongs to, "YYYY-MM-DD".
   *
   * Present on SCHOOL_PERIOD rows only. An EXTRA_CLASS is a standing weekly
   * arrangement with no week of its own, so it carries no date and cannot be
   * locked by one — see docs/SCHEDULE_PARENT_IMP.md §12.2.
   */
  weekStartDate?: string
  eventType?: EventType
  subjectId: string
  /** Lesson variant as the timetable prints it: "Học vần", "Tập viết", "Ôn tập". */
  note?: string
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
  /**
   * Today's non-lesson slots — ra chơi, ăn trưa & ngủ, giờ tan học. Optional so
   * a household that has not set a bell schedule, and an older mobile build,
   * both keep working.
   */
  bellSlots?: BellSlot[]
  /**
   * Set when today falls in a holiday or nghỉ hè. `schoolPeriods` is then empty
   * — the timetable does not run — while evening classes and homework stay,
   * because summer classes and summer homework are real.
   */
  activeBreak?: SchoolBreak
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
  /** Which week `days` describes. Absent on responses predating Phase 6. */
  weekStartDate?: string
  /** Where `days` came from — see WeekSource. */
  source?: WeekSource
  /** The week the rows were actually read from, when `source` is 'inherited'. */
  inheritedFrom?: string
}

/**
 * How a week's timetable was resolved.
 *
 *  - `own`       — the week has rows of its own; editing changes only this week
 *  - `inherited` — no rows yet, so the most recent earlier week is shown; the
 *                  first edit materialises this week and stops the inheritance
 *  - `empty`     — no timetable has ever been entered for this student
 *
 * The distinction is shown to the parent rather than hidden: "these are last
 * week's lessons" and "these are this week's lessons" look identical on screen
 * but behave differently on save.
 */
export type WeekSource = 'own' | 'inherited' | 'empty'

/**
 * Why the regular timetable does not run.
 *
 * PUBLIC_HOLIDAY is a day off — Tết, 30/4, or one the school declares.
 * SUMMER_BREAK is nghỉ hè: the 2–3 months between one grade and the next,
 * declared by the parent when the school announces it. Summer classes and
 * summer homework continue through it, so it suppresses the school timetable
 * and nothing else.
 */
export type SchoolBreakKind = 'PUBLIC_HOLIDAY' | 'SUMMER_BREAK'

/** A stretch of days on which the school timetable does not run. */
export interface SchoolBreak {
  id?: string
  kind: SchoolBreakKind
  label: string
  /** Inclusive "YYYY-MM-DD". A single-day holiday has startDate === endDate. */
  startDate: string
  endDate: string
  /** Set when the row came from the shipped Vietnamese list. */
  presetKey?: string
  /**
   * True for a lunar-derived default whose real dates the school announces.
   * Shown to the parent as "kiểm tra lại ngày" rather than passed off as fact.
   */
  needsReview?: boolean
  /**
   * SUMMER_BREAK only — the grade the child returns to afterwards.
   *
   * Usually the current grade plus one, but deliberately storable as the SAME
   * grade: a child repeating a year still has a summer. Null on a summer break
   * entered before this field existed, which simply means no promotion is
   * offered for it.
   */
  promotesToGrade?: number
  /** ISO timestamp of the parent confirming the promotion. Never set by a clock alone. */
  promotedAt?: string
}

/** A week of school periods, with the provenance the grid needs to explain itself. */
export interface WeekSchedule {
  weekStartDate: string
  source: WeekSource
  inheritedFrom?: string
  days: DailySchedule[]
}

/** GET /api/v1/kid-profile — the kid's display name and grade. */
export interface KidProfile {
  name: string
  gradeLevel: number
}

/** GET /api/v1/students/:studentId/kid-session — whether a pattern is configured. */
export interface KidPatternStatus {
  hasKidPatternSet: boolean
}

/** POST /api/v1/students/:studentId/kid-session — the outcome of one attempt. */
export interface KidPatternVerify {
  status: 'ok' | 'wrong' | 'locked' | 'not-configured'
  lockoutSeconds?: number
  /**
   * Present only on 'ok'. Scoped to this one student and carrying no parent
   * identity, so the client can act as the child rather than as the parent.
   */
  kidToken?: string
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
