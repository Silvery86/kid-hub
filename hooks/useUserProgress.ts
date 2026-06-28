'use client'

/** User progress context — manages points, streaks, and badge state persisted to localStorage. */

import {
  createContext,
  createElement,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import type { UserProgress } from '@/types'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/lib/constants'
import { BADGE_DEFINITIONS } from '@/lib/data/badges'
import { calculateNewStreak } from '@/lib/utils'

// Seed progress — first-login and streak-3 badges pre-awarded for demonstration
const DEFAULT_PROGRESS: UserProgress = {
  userId: 'khoi',
  totalPoints: 150,
  currentStreak: 3,
  lastActiveDate: '2026-03-13',
  earnedBadges: BADGE_DEFINITIONS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    iconEmoji: def.iconEmoji,
    isEarned: def.id === 'first-login' || def.id === 'streak-3',
    earnedAt: def.id === 'first-login' || def.id === 'streak-3' ? '2026-03-10' : undefined,
  })),
  bestScores: [],
}

interface UserProgressContextValue {
  progress: UserProgress
  addPoints: (amount: number) => void
  updateStreak: () => void
  awardBadge: (badgeId: string) => void
}

const UserProgressContext = createContext<UserProgressContextValue | null>(null)

export const UserProgressProvider = ({ children }: { children: ReactNode }) => {
  const [progress, setProgress] = useLocalStorage<UserProgress>(
    STORAGE_KEYS.USER_PROGRESS,
    DEFAULT_PROGRESS
  )

  const addPoints = useCallback(
    (amount: number) => {
      setProgress((prev) => ({ ...prev, totalPoints: prev.totalPoints + amount }))
    },
    [setProgress]
  )

  const updateStreak = useCallback(() => {
    const today = new Date().toISOString().split('T')[0] ?? ''
    setProgress((prev) => {
      if (prev.lastActiveDate === today) return prev
      const newStreak = calculateNewStreak(prev.currentStreak, prev.lastActiveDate, today)
      return { ...prev, currentStreak: newStreak, lastActiveDate: today }
    })
  }, [setProgress])

  const awardBadge = useCallback(
    (badgeId: string) => {
      setProgress((prev) => {
        const alreadyEarned = prev.earnedBadges.some((b) => b.id === badgeId && b.isEarned)
        if (alreadyEarned) return prev
        return {
          ...prev,
          earnedBadges: prev.earnedBadges.map((b) =>
            b.id === badgeId ? { ...b, isEarned: true, earnedAt: new Date().toISOString() } : b
          ),
        }
      })
    },
    [setProgress]
  )

  const value = useMemo(
    () => ({ progress, addPoints, updateStreak, awardBadge }),
    [progress, addPoints, updateStreak, awardBadge]
  )

  return createElement(UserProgressContext.Provider, { value }, children)
}

export const useUserProgress = (): UserProgressContextValue => {
  const ctx = useContext(UserProgressContext)
  if (!ctx) throw new Error('useUserProgress must be used inside <UserProgressProvider>')
  return ctx
}
