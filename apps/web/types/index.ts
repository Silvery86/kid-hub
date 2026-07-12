// ============================================================
// KID HUB — Web type surface
// Contract types are OWNED by @kid-hub/shared (Phase 1 — mobile_imp.md §10)
// and re-exported here so existing `@/types` imports keep resolving.
// Only web-only shapes (React-coupled or server-session internal) are
// defined locally below. Do NOT redefine contract types here.
// ============================================================

import type { MutableRefObject } from 'react'
import type { GameSessionState } from '@/hooks/useGameSession'
import type { DifficultyLevel, GameBestScore } from '@kid-hub/shared'

// Re-export the whole cross-platform contract (schedule, grades, game, result).
export * from '@kid-hub/shared'

// ── User & Profile ───────────────────────────────────────────

export interface UserProfile {
  id: string
  name: string
  gradeLevel: number // e.g. 1 for 1st grade
  avatarUrl?: string
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
  play: (key: 'correct' | 'wrong' | 'complete' | 'tap') => void
  bestScore: GameBestScore | null
  saveError: string | null
}
