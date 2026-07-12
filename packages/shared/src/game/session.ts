/**
 * Pure game-session state machine — no React, no DOM, no timers.
 *
 * Owns question flow, per-question countdown, correct/wrong progression and the
 * session lifecycle. Web (`useGameSession`) and Mobile wrap this reducer with
 * their own timer + effects; the transition logic itself lives here so both
 * platforms behave identically.
 */

import type { GameStatus, GameType, DifficultyLevel } from '../types'
import { GAME_QUESTIONS_PER_SESSION, GAME_SECONDS_PER_QUESTION } from '../constants'

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

export type GameAction =
  | { type: 'START'; gameType: GameType; level: DifficultyLevel; secondsPerQuestion: number }
  | { type: 'ANSWER_CORRECT'; secondsPerQuestion: number }
  | { type: 'ANSWER_WRONG'; secondsPerQuestion: number }
  | { type: 'TICK'; secondsPerQuestion: number }
  | { type: 'FINISH' }
  | { type: 'RESET' }

export const initialGameSessionState: GameSessionState = {
  status: 'idle',
  gameType: 'math',
  level: 1,
  currentQuestionIndex: 0,
  correctCount: 0,
  totalQuestions: GAME_QUESTIONS_PER_SESSION,
  secondsLeft: GAME_SECONDS_PER_QUESTION,
  startedAt: 0,
}

export const gameReducer = (state: GameSessionState, action: GameAction): GameSessionState => {
  switch (action.type) {
    case 'START':
      return {
        ...initialGameSessionState,
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
      return initialGameSessionState

    default:
      return state
  }
}
