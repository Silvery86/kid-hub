// Local mirror of the apps/web contract types the mobile screens consume.
// Phase 5 (mobile-app-migrate.md §16) migrates these into @kid-hub/shared so
// Web and Mobile share one source of truth; until then keep them here.

export type EventType = 'SCHOOL_PERIOD' | 'EXTRA_CLASS'

export interface HomeworkItem {
  periodId: string
  subjectId: string
  homeworkNote: string
  startTime: string
  isDone: boolean
  doneAt?: string
}

export interface ClassPeriod {
  id?: string
  periodNumber?: number
  eventType?: EventType
  subjectId: string
  startTime: string // "HH:MM"
  endTime: string // "HH:MM"
  roomNumber?: string
  iconKey?: string
  sortOrder?: number
}

export interface DailyHomework {
  id: string
  date: string // "YYYY-MM-DD"
  subjectId: string
  label: string
  iconKey?: string
  isDone: boolean
  doneAt?: string
  points: number
}

export interface TodayView {
  date: string // "YYYY-MM-DD"
  schoolPeriods: ClassPeriod[]
  eveningBlocks: ClassPeriod[]
  cancelledIds: string[]
  homework: DailyHomework[]
}

export type BadgeTier = 'excellent' | 'good' | 'needs-practice'

export interface SubjectGrade {
  subjectId: string
  score: number // 0–10
  badge: BadgeTier
  semester: 1 | 2
  academicYear: string
}

export interface ReportCard {
  userId: string
  grades: SubjectGrade[]
  averageScore: number
}
