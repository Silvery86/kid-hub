'use client'

/**
 * useEnglishSession — wraps useGameSession and persists completed sessions to the database
 * via saveEnglishProgressAction. Also exposes homework-aware submit flow.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useGameSession, calculateStars, calculatePointsEarned } from '@/hooks/useGameSession'
import { useAudio } from '@/hooks/useAudio'
import { useUserProgress } from '@/hooks/useUserProgress'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { saveEnglishProgressAction } from '@/server/actions/english.actions'
import { STORAGE_KEYS } from '@/lib/constants'
import { todayDateKey } from '@/lib/clientDateUtils'
import type { DifficultyLevel, GameBestScore, EnglishGameType, UseGameSessionHookResult } from '@/types'

interface UseEnglishSessionOptions {
  minigame: EnglishGameType
  secondsPerQuestion: number
  homeworkPeriodId?: string
}

/**
 * Manages an English mini-game session lifecycle:
 * drives the state machine, saves results to DB on completion,
 * and handles best-score updates in localStorage.
 */
export const useEnglishSession = ({
  minigame,
  secondsPerQuestion,
  homeworkPeriodId,
}: UseEnglishSessionOptions): UseGameSessionHookResult => {
  const { state, startGame, answerCorrect: rawCorrect, answerWrong: rawWrong } = useGameSession()
  const { initialise, play } = useAudio()
  const { addPoints } = useUserProgress()
  const [progress, setProgress] = useLocalStorage<import('@/types').UserProgress | null>(
    STORAGE_KEYS.USER_PROGRESS,
    null
  )
  const bestScores: GameBestScore[] = Array.isArray(progress?.bestScores) ? progress.bestScores : []
  const saveErrorRef = useRef<string | null>(null)
  const isProcessing = useRef(false)

  const starsEarned = calculateStars(state.correctCount, state.totalQuestions)
  const pointsEarned = calculatePointsEarned(state.correctCount, starsEarned)

  const start = useCallback(
    (level: DifficultyLevel) => {
      initialise()
      saveErrorRef.current = null
      startGame('english', level, secondsPerQuestion)
    },
    [initialise, startGame, secondsPerQuestion]
  )

  useEffect(() => {
    if (state.status !== 'result') return

    play('complete')
    addPoints(pointsEarned)

    const newBest: GameBestScore = {
      gameType: 'english',
      level: state.level,
      score: state.correctCount * 10,
      starsEarned,
      achievedAt: new Date().toISOString(),
      subType: minigame,
    }
    setProgress((prev) => {
      const prevScores: GameBestScore[] = Array.isArray(prev?.bestScores) ? prev.bestScores : []
      const filtered = prevScores.filter(
        (b) => !(b.gameType === 'english' && b.level === state.level && b.subType === minigame)
      )
      return prev ? { ...prev, bestScores: [...filtered, newBest] } : null
    })

    const timeSpentSecs = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000))
    saveEnglishProgressAction({
      minigame,
      level: state.level,
      correctCount: state.correctCount,
      incorrectCount: state.totalQuestions - state.correctCount,
      timeSpentSecs,
      homeworkPeriodId,
      homeworkDate: homeworkPeriodId ? todayDateKey() : undefined,
    }).then((res) => {
      if (!res.success) saveErrorRef.current = res.error ?? 'Save failed'
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status])

  const answerCorrect = useCallback(
    () => rawCorrect(secondsPerQuestion),
    [rawCorrect, secondsPerQuestion]
  )

  const answerWrong = useCallback(
    () => rawWrong(secondsPerQuestion),
    [rawWrong, secondsPerQuestion]
  )

  const bestScore =
    bestScores.find(
      (b) => b.gameType === 'english' && b.level === state.level && b.subType === minigame
    ) ?? null

  return {
    state,
    starsEarned,
    pointsEarned,
    isProcessing,
    start,
    answerCorrect,
    answerWrong,
    play,
    bestScore,
    saveError: saveErrorRef.current,
  }
}
