// ============================================================
// KID HUB — Shared TypeScript Interfaces & Types
// Single source of truth for ALL data shapes in the project.
// Do NOT redefine these locally in components or hooks.
// ============================================================

import type { MutableRefObject } from 'react'
import type { GameSessionState } from '@/hooks/useGameSession'

// ── User & Profile ───────────────────────────────────────────

export interface UserProfile {
  id: string
  name: string
  gradeLevel: number // e.g. 1 for 1st grade
  avatarUrl?: string
}

// ── Schedule ─────────────────────────────────────────────────

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

/** @deprecated Use DailyHomework. Kept for backward compat with HomeworkChip / DashboardView. */
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
export type MathGameType = 'counting' | 'addition' | 'shapes'
export type EnglishGameType = 'alphabet' | 'vocabulary' | 'phonics'
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

export interface CountingQuestion {
  id: string
  objectEmoji: string
  count: number
  choices: number[]       // [correct, distractor1, distractor2] shuffled
  correctIndex: number
}

export type ShapeId = 'circle' | 'square' | 'triangle' | 'rectangle' | 'star' | 'heart'

export interface ShapeQuestion {
  id: string
  mode: 'name-to-shape' | 'shape-to-name'
  targetShape: ShapeId
  choices: ShapeId[]      // [correct, distractor1, distractor2] shuffled
  correctIndex: number
}

export interface EnglishQuestion {
  id: string
  type: 'letter-match' | 'picture-word' | 'sentence-arrange'
  prompt: string
  imageUrl?: string
  correctAnswer: string
  options: string[]
}

export interface AlphabetQuestion {
  id: string
  type: 'upper-to-lower' | 'lower-to-upper'
  prompt: string        // The displayed letter (uppercase or lowercase)
  choices: string[]     // 4 letters (correct + 3 distractors), shuffled
  correctAnswer: string
}

export interface WordSafariQuestion {
  id: string
  type: 'image-to-word' | 'word-to-image'
  prompt: string         // Emoji (Mode A) or word text (Mode B)
  choices: string[]      // 3–4 items (words for Mode A, emojis for Mode B), shuffled
  correctAnswer: string
  theme: 'animals' | 'fruits' | 'other'
}

export interface SoundHuntQuestion {
  id: string
  type: 'sound-hunt'
  targetLetter: string   // e.g. 'C'
  phonemeHint: string    // e.g. '/k/ — "c" trong từ "cat"'
  choices: string[]      // 3–4 emoji strings, shuffled
  correctAnswer: string  // The emoji whose word starts with targetLetter
  correctWord: string    // The word (e.g. 'cat') — for test assertion
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
  subType?: string   // "counting" | "addition" | "shapes" for math; "alphabet" | "vocabulary" | "phonics" for english
}

interface SaveProgressInputBase {
  level: DifficultyLevel
  correctCount: number
  incorrectCount: number
  timeSpentSecs: number
  homeworkPeriodId?: string
  homeworkDate?: string
}

export interface SaveMathProgressInput extends SaveProgressInputBase {
  minigame: MathGameType
}

export interface SaveEnglishProgressInput extends SaveProgressInputBase {
  minigame: EnglishGameType
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

export interface ParentRefreshSession {
  userId: string
  expiresAt: number // Unix timestamp ms
}

export interface KidSession {
  userId: string
  expiresAt: number // Unix timestamp ms
}

// ── Server Action Result Types ────────────────────────────────

/** For actions that return no payload on success. */
export type ActionVoidResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/** Discriminated union for actions that return typed data on success. */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/** For auth actions that may be locked out (login, PIN, kid pattern). */
export type AuthActionResult =
  | { success: true }
  | { success: false; error: string; isLocked?: boolean; lockoutSeconds?: number; isWrong?: boolean }

// ── Shared Hook Result Types ──────────────────────────────────

/** Shared return type for useMathSession and useEnglishSession. */
export interface UseGameSessionHookResult {
  state: GameSessionState
  starsEarned: 1 | 2 | 3
  pointsEarned: number
  isProcessing: MutableRefObject<boolean>
  start: (level: DifficultyLevel) => void
  answerCorrect: () => void
  answerWrong: () => void
  bestScore: GameBestScore | null
  saveError: string | null
}
