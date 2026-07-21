// use-game-session.ts — React Native wrapper over the shared pure game reducer.
// Mirrors apps/web/hooks/useGameSession.ts: the state machine + scoring live in
// @kid-hub/shared; this adds the RN timer (setInterval) + a transition lock so a
// double-tap can't advance two questions.
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { DifficultyLevel, GameSessionState, GameType } from '@kid-hub/shared'
import {
  GAME_SECONDS_PER_QUESTION,
  calculatePointsEarned,
  calculateStars,
  gameReducer,
  initialGameSessionState,
} from '@kid-hub/shared'

export interface UseGameSessionResult {
  state: GameSessionState
  isTransitioning: boolean
  startGame: (gameType: GameType, level: DifficultyLevel, secondsPerQuestion?: number) => void
  answerCorrect: (secondsPerQuestion?: number) => void
  answerWrong: (secondsPerQuestion?: number) => void
  resetGame: () => void
  starsEarned: 1 | 2 | 3
  pointsEarned: number
}

export function useGameSession(): UseGameSessionResult {
  const [state, dispatch] = useReducer(gameReducer, initialGameSessionState)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isTransitioningRef = useRef(false)
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

  const advance = useCallback((type: 'ANSWER_CORRECT' | 'ANSWER_WRONG', secondsPerQuestion: number) => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true
    setIsTransitioning(true)
    dispatch({ type, secondsPerQuestion })
    setTimeout(() => {
      isTransitioningRef.current = false
      setIsTransitioning(false)
    }, 400)
  }, [])

  const answerCorrect = useCallback(
    (secondsPerQuestion = GAME_SECONDS_PER_QUESTION) => advance('ANSWER_CORRECT', secondsPerQuestion),
    [advance]
  )
  const answerWrong = useCallback(
    (secondsPerQuestion = GAME_SECONDS_PER_QUESTION) => advance('ANSWER_WRONG', secondsPerQuestion),
    [advance]
  )
  const resetGame = useCallback(() => dispatch({ type: 'RESET' }), [])

  const starsEarned = calculateStars(state.correctCount, state.totalQuestions)
  const pointsEarned = calculatePointsEarned(state.correctCount, starsEarned)

  return {
    state,
    isTransitioning,
    startGame,
    answerCorrect,
    answerWrong,
    resetGame,
    starsEarned,
    pointsEarned,
  }
}
