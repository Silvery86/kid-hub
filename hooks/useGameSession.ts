'use client'

/** Game session state machine — manages question flow, timer, scoring, and session lifecycle. */

import { useReducer, useCallback, useEffect, useRef } from 'react'
import type { GameStatus, GameType, DifficultyLevel } from '@/types'
import { GAME_QUESTIONS_PER_SESSION, GAME_SECONDS_PER_QUESTION, MAX_STARS } from '@/lib/constants'
import { clamp, calculateScore } from '@/lib/utils'

// ── State ─────────────────────────────────────────────────────

export interface GameSessionState {
  status: GameStatus
  gameType: GameType
  level: DifficultyLevel
  currentQuestionIndex: number
  correctCount: number
  totalQuestions: number
  secondsLeft: number
  startedAt: number
}

// ── Actions ───────────────────────────────────────────────────

type GameAction =
  | { type: 'START'; gameType: GameType; level: DifficultyLevel; secondsPerQuestion: number }
  | { type: 'ANSWER_CORRECT'; secondsPerQuestion: number }
  | { type: 'ANSWER_WRONG'; secondsPerQuestion: number }
  | { type: 'TICK'; secondsPerQuestion: number }
  | { type: 'FINISH' }
  | { type: 'RESET' }

// ── Reducer ───────────────────────────────────────────────────

const initialState: GameSessionState = {
  status: 'idle',
  gameType: 'math',
  level: 1,
  currentQuestionIndex: 0,
  correctCount: 0,
  totalQuestions: GAME_QUESTIONS_PER_SESSION,
  secondsLeft: GAME_SECONDS_PER_QUESTION,
  startedAt: 0,
}

const gameReducer = (state: GameSessionState, action: GameAction): GameSessionState => {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        status: 'playing',
        gameType: action.gameType,
        level: action.level,
        secondsLeft: action.secondsPerQuestion,
        startedAt: Date.now(),
      }

    case 'ANSWER_CORRECT': {
      const nextIndex = state.currentQuestionIndex + 1
      const isLast = nextIndex >= state.totalQuestions
      return {
        ...state,
        correctCount: state.correctCount + 1,
        currentQuestionIndex: nextIndex,
        secondsLeft: action.secondsPerQuestion,
        status: isLast ? 'result' : 'playing',
      }
    }

    case 'ANSWER_WRONG': {
      const nextIndex = state.currentQuestionIndex + 1
      const isLast = nextIndex >= state.totalQuestions
      return {
        ...state,
        currentQuestionIndex: nextIndex,
        secondsLeft: action.secondsPerQuestion,
        status: isLast ? 'result' : 'playing',
      }
    }

    case 'TICK': {
      if (state.secondsLeft <= 1) {
        // Time ran out for this question — treat as wrong
        const nextIndex = state.currentQuestionIndex + 1
        const isLast = nextIndex >= state.totalQuestions
        return {
          ...state,
          currentQuestionIndex: nextIndex,
          secondsLeft: action.secondsPerQuestion,
          status: isLast ? 'result' : 'playing',
        }
      }
      return { ...state, secondsLeft: state.secondsLeft - 1 }
    }

    case 'FINISH':
      return { ...state, status: 'result' }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

// ── Derived helpers ───────────────────────────────────────────

export const calculateStars = (correctCount: number, total: number): 1 | 2 | 3 => {
  const pct = calculateScore(correctCount, total)
  if (pct >= 90) return 3
  if (pct >= 60) return 2
  return 1
}

export const calculatePointsEarned = (correctCount: number, stars: 1 | 2 | 3): number =>
  clamp(correctCount * 10 * stars, 0, 300)

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
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const isTransitioning = useRef(false)
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
    if (isTransitioning.current) return
    isTransitioning.current = true
    dispatch({ type: 'ANSWER_CORRECT', secondsPerQuestion })
    setTimeout(() => {
      isTransitioning.current = false
    }, 400)
  }, [])

  const answerWrong = useCallback((secondsPerQuestion = GAME_SECONDS_PER_QUESTION) => {
    if (isTransitioning.current) return
    isTransitioning.current = true
    dispatch({ type: 'ANSWER_WRONG', secondsPerQuestion })
    setTimeout(() => {
      isTransitioning.current = false
    }, 400)
  }, [])

  const resetGame = useCallback(() => dispatch({ type: 'RESET' }), [])

  const starsEarned = calculateStars(state.correctCount, state.totalQuestions)
  const pointsEarned = calculatePointsEarned(state.correctCount, starsEarned)
  const scorePercent = calculateScore(state.correctCount, state.totalQuestions)

  return {
    state,
    isTransitioning: isTransitioning.current,
    startGame,
    answerCorrect,
    answerWrong,
    resetGame,
    starsEarned,
    pointsEarned,
    scorePercent,
  }
}
