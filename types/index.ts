// ============================================================
// KID HUB — Shared TypeScript Interfaces & Types
// Single source of truth for ALL data shapes in the project.
// Do NOT redefine these locally in components or hooks.
// ============================================================

// ── User & Profile ───────────────────────────────────────────

export interface UserProfile {
  id: string
  name: string
  gradeLevel: number // e.g. 1 for 1st grade
  avatarUrl?: string
}

// ── Schedule ─────────────────────────────────────────────────

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'

export interface ClassPeriod {
  id?: string
  periodNumber: number
  subjectId: string
  startTime: string // "HH:MM" 24-hour format
  endTime: string // "HH:MM" 24-hour format
  roomNumber?: string
  isHomework?: boolean
  homeworkNote?: string
}

export interface HomeworkItem {
  periodId: string
  subjectId: string
  homeworkNote: string
  startTime: string
  isDone: boolean
  doneAt?: string // ISO date string
}

export interface DailySchedule {
  day: DayOfWeek
  periods: ClassPeriod[]
}

export interface WeeklySchedule {
  weekStartDate: string // ISO date "YYYY-MM-DD"
  days: DailySchedule[]
}

export interface Subject {
  id: string
  name: string
  colorClass: string // Tailwind bg class e.g. "bg-blue-400"
  iconName: string // lucide-react icon name
}

// ── Grades ───────────────────────────────────────────────────

export type BadgeTier = 'excellent' | 'good' | 'needs-practice'

export interface SubjectGrade {
  subjectId: string
  score: number // 0–10 scale
  badge: BadgeTier
  semester: 1 | 2
  academicYear: string // e.g. "2025-2026"
}

export interface ReportCard {
  userId: string
  grades: SubjectGrade[]
  averageScore: number
}

// ── Games ────────────────────────────────────────────────────

export type GameType = 'math' | 'english'
export type GameStatus = 'idle' | 'playing' | 'paused' | 'result'
export type DifficultyLevel = 1 | 2 | 3

export interface MathQuestion {
  id: string
  operandA: number
  operandB: number
  operator: '+' | '-'
  correctAnswer: number
  options: [number, number] // Always exactly two choices
}

export interface EnglishQuestion {
  id: string
  type: 'letter-match' | 'picture-word' | 'sentence-arrange'
  prompt: string
  imageUrl?: string
  correctAnswer: string
  options: string[]
}

export interface GameSession {
  gameType: GameType
  level: DifficultyLevel
  status: GameStatus
  currentQuestionIndex: number
  score: number
  correctCount: number
  totalQuestions: number
  startedAt: number // Unix timestamp ms
}

export interface GameBestScore {
  gameType: GameType
  level: DifficultyLevel
  score: number
  starsEarned: 1 | 2 | 3
  achievedAt: string // ISO date string
}

// ── Gamification ─────────────────────────────────────────────

export interface Badge {
  id: string
  name: string
  description: string
  iconEmoji: string
  isEarned: boolean
  earnedAt?: string // ISO date string
}

export interface UserProgress {
  userId: string
  totalPoints: number
  currentStreak: number
  lastActiveDate: string // ISO date string
  earnedBadges: Badge[]
  bestScores: GameBestScore[]
}

// ── Parent Mode ───────────────────────────────────────────────

export interface ParentPin {
  hash: string // bcrypt hash — stored server-side only
  createdAt: string // ISO date string
}

export interface ParentSession {
  userId: string
  expiresAt: number // Unix timestamp ms
}
