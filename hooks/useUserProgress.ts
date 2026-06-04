'use client'

import {
  createContext,
  createElement,
  useContext,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react'
import type { UserProgress } from '@/types'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/lib/constants'
import { BADGE_DEFINITIONS } from '@/lib/data/badges'
import { calculateNewStreak } from '@/lib/utils'
import {
  getProgressAction,
  syncPointsAction,
  syncStreakAction,
} from '@/server/actions/progress.actions'

// Minimal starting state — replaced by DB data on first mount.
const DEFAULT_PROGRESS: UserProgress = {
  userId: 'khoi',
  totalPoints: 0,
  currentStreak: 0,
  lastActiveDate: '',
  earnedBadges: BADGE_DEFINITIONS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    iconEmoji: def.iconEmoji,
    isEarned: false,
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

  // On mount: pull from DB and sync if DB is ahead of localStorage.
  useEffect(() => {
    getProgressAction().then((result) => {
      if (!result.success || !result.data) return
      const db = result.data
      setProgress((prev) => {
        // Prefer DB when totals diverge or localStorage has never been set.
        if (db.totalPoints < prev.totalPoints && prev.totalPoints > 0) return prev
        const earnedSet = new Set(db.earnedBadgeIds)
        return {
          ...prev,
          totalPoints: db.totalPoints,
          currentStreak: db.currentStreak,
          lastActiveDate: db.lastActiveDate,
          earnedBadges: prev.earnedBadges.map((b) =>
            earnedSet.has(b.id) ? { ...b, isEarned: true } : b
          ),
        }
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addPoints = useCallback(
    (amount: number) => {
      // Optimistic update — immediately visible to the kid.
      setProgress((prev) => ({ ...prev, totalPoints: prev.totalPoints + amount }))
      // Persist to DB and reconcile with authoritative total.
      void syncPointsAction(amount).then((result) => {
        if (result.success && result.newTotal !== undefined) {
          setProgress((prev) => ({ ...prev, totalPoints: result.newTotal! }))
        }
      })
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
    // Persist to DB and reconcile streak with server-calculated value.
    void syncStreakAction().then((result) => {
      if (result.success && result.newStreak !== undefined) {
        const today2 = new Date().toISOString().split('T')[0] ?? ''
        setProgress((prev) => ({
          ...prev,
          currentStreak: result.newStreak!,
          lastActiveDate: today2,
        }))
      }
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
