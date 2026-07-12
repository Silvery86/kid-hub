import { describe, it, expect } from 'vitest'
import { gameReducer, initialGameSessionState, type GameSessionState } from './session'

const playing = (over: Partial<GameSessionState> = {}): GameSessionState => ({
  ...initialGameSessionState,
  status: 'playing',
  ...over,
})

describe('gameReducer', () => {
  it('START enters playing and resets counters', () => {
    const s = gameReducer(initialGameSessionState, {
      type: 'START',
      gameType: 'english',
      level: 3,
      secondsPerQuestion: 10,
    })
    expect(s.status).toBe('playing')
    expect(s.gameType).toBe('english')
    expect(s.level).toBe(3)
    expect(s.correctCount).toBe(0)
    expect(s.currentQuestionIndex).toBe(0)
    expect(s.secondsLeft).toBe(10)
  })

  it('ANSWER_CORRECT increments correctCount and finishes on the last question', () => {
    let s = playing({ totalQuestions: 2 })
    s = gameReducer(s, { type: 'ANSWER_CORRECT', secondsPerQuestion: 10 })
    expect(s.correctCount).toBe(1)
    expect(s.currentQuestionIndex).toBe(1)
    expect(s.status).toBe('playing')
    s = gameReducer(s, { type: 'ANSWER_CORRECT', secondsPerQuestion: 10 })
    expect(s.correctCount).toBe(2)
    expect(s.status).toBe('result')
  })

  it('ANSWER_WRONG advances without scoring', () => {
    const s = gameReducer(playing({ totalQuestions: 5 }), {
      type: 'ANSWER_WRONG',
      secondsPerQuestion: 10,
    })
    expect(s.correctCount).toBe(0)
    expect(s.currentQuestionIndex).toBe(1)
  })

  it('TICK counts down, then advances as wrong when time runs out', () => {
    let s = playing({ secondsLeft: 2, totalQuestions: 3 })
    s = gameReducer(s, { type: 'TICK', secondsPerQuestion: 10 })
    expect(s.secondsLeft).toBe(1)
    s = gameReducer(s, { type: 'TICK', secondsPerQuestion: 10 })
    expect(s.currentQuestionIndex).toBe(1)
    expect(s.correctCount).toBe(0)
    expect(s.secondsLeft).toBe(10)
  })

  it('RESET returns the initial state', () => {
    const s = gameReducer(playing({ correctCount: 5 }), { type: 'RESET' })
    expect(s).toEqual(initialGameSessionState)
  })
})
