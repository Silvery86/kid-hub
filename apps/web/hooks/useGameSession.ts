'use client'

/**
 * Game session React hook — a thin wrapper over the shared pure reducer.
 * The state machine (reducer, initial state, actions) and scoring live in
 * @kid-hub/shared (Phase 3); this file adds the React timer + transition lock.
 */

import { useReducer, useCallback, useEffect, useRef, useState } from 'react'
import type { GameType, DifficultyLevel } from '@/types'
import type { GameSessionState } from '@kid-hub/shared'
import {
  gameReducer,
  initialGameSessionState,
  calculateStars,
  calculatePointsEarned,
  GAME_SECONDS_PER_QUESTION,
} from '@kid-hub/shared'
import { calculateScore } from '@/lib/utils'

// Re-export the shared session type + scoring helpers so existing consumers
// (types/index.ts, useMathSession, useEnglishSession) keep importing from here.
export type { GameSessionState } from '@kid-hub/shared'
export { calculateStars, calculatePointsEarned } from '@kid-hub/shared'

// ── Hook ──────────────────────────────────────────────────────

export interface UseGameSessionResult {
  state: GameSessionState
  isTransitioning: boolean
  startGame: (gameType: GameType, level: DifficultyLevel, secondsPerQuestion?: number) => void
  answerCorrect: (secondsPerQuestion?: number) => void
  answerWrong: (secondsPerQuestion?: number) => void
  resetGame: () => void
  starsEarned: 1 | 2 | 3
  pointsEarned: number
  scorePercent: number
}

export const useGameSession = (): UseGameSessionResult => {
  const [state, dispatch] = useReducer(gameReducer, initialGameSessionState)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isTransitioningRef = useRef(false)
  // Timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const secondsPerQuestionRef = useRef(GAME_SECONDS_PER_QUESTION)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (state.status === 'playing') {
      clearTimer()
      timerRef.current = setInterval(
        () => dispatch({ type: 'TICK', secondsPerQuestion: secondsPerQuestionRef.current }),
        1000
      )
    } else {
      clearTimer()
    }
    return clearTimer
  }, [state.status, state.currentQuestionIndex, clearTimer])

  const startGame = useCallback(
    (gameType: GameType, level: DifficultyLevel, secondsPerQuestion = GAME_SECONDS_PER_QUESTION) => {
      secondsPerQuestionRef.current = secondsPerQuestion
      dispatch({ type: 'START', gameType, level, secondsPerQuestion })
    },
    []
  )

  const answerCorrect = useCallback((secondsPerQuestion = GAME_SECONDS_PER_QUESTION) => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true
    setIsTransitioning(true)
    dispatch({ type: 'ANSWER_CORRECT', secondsPerQuestion })
    setTimeout(() => {
      isTransitioningRef.current = false
      setIsTransitioning(false)
    }, 400)
  }, [])

  const answerWrong = useCallback((secondsPerQuestion = GAME_SECONDS_PER_QUESTION) => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true
    setIsTransitioning(true)
    dispatch({ type: 'ANSWER_WRONG', secondsPerQuestion })
    setTimeout(() => {
      isTransitioningRef.current = false
      setIsTransitioning(false)
    }, 400)
  }, [])

  const resetGame = useCallback(() => dispatch({ type: 'RESET' }), [])

  const starsEarned = calculateStars(state.correctCount, state.totalQuestions)
  const pointsEarned = calculatePointsEarned(state.correctCount, starsEarned)
  const scorePercent = calculateScore(state.correctCount, state.totalQuestions)

  return {
    state,
    isTransitioning,
    startGame,
    answerCorrect,
    answerWrong,
    resetGame,
    starsEarned,
    pointsEarned,
    scorePercent,
  }
}
