// Contract tests for the typed api-client fetchers. A stub transport returns
// either a valid or a deliberately-malformed payload; the client must resolve
// the valid one (unchanged) and THROW on the malformed one — proving the
// response-schema guard turns silent server drift into a loud error for mobile.
import { describe, expect, it } from 'vitest'
import type { HttpTransport } from '../http'
import { getSchedule } from './schedule'
import { getGrades } from './grades'
import { getTodayHomework } from './homework'
import { getMathBestScores, saveMathProgress } from './math'
import { getEnglishBestScores, saveEnglishProgress } from './english'

/** Transport stub that returns a fixed payload for every verb. */
const stub = (payload: unknown): HttpTransport => ({
  get: async () => payload as never,
  post: async () => payload as never,
  put: async () => payload as never,
  patch: async () => payload as never,
  delete: async () => payload as never,
})

describe('api-client validates valid responses through', () => {
  it('getSchedule returns a parsed TodayView', async () => {
    const view = {
      date: '2026-08-04',
      schoolPeriods: [],
      eveningBlocks: [],
      cancelledIds: [],
      homework: [],
    }
    await expect(getSchedule(stub(view))).resolves.toEqual(view)
  })

  it('getGrades returns a parsed ReportCard', async () => {
    const card = { userId: 'u', grades: [], averageScore: 0 }
    await expect(getGrades(stub(card))).resolves.toEqual(card)
  })

  it('getTodayHomework returns a parsed HomeworkItem[]', async () => {
    const items = [
      { periodId: 'h1', subjectId: 'math', homeworkNote: 'x', startTime: '', isDone: false },
    ]
    await expect(getTodayHomework(stub(items))).resolves.toEqual(items)
  })

  it('getMathBestScores / getEnglishBestScores return parsed GameBestScore[]', async () => {
    const scores = [
      { gameType: 'math', level: 1, score: 10, starsEarned: 1, achievedAt: '2026-08-04T00:00:00.000Z' },
    ]
    await expect(getMathBestScores(stub(scores))).resolves.toEqual(scores)
    const eng = [{ ...scores[0], gameType: 'english' }]
    await expect(getEnglishBestScores(stub(eng))).resolves.toEqual(eng)
  })

  it('saveMathProgress / saveEnglishProgress return a parsed GameSaveResult', async () => {
    const result = { starsEarned: 2, score: 120, pointsEarned: 40, isNewBest: true }
    await expect(
      saveMathProgress(stub(result), {
        minigame: 'addition',
        level: 1,
        correctCount: 8,
        incorrectCount: 2,
        timeSpentSecs: 60,
      })
    ).resolves.toEqual(result)
    await expect(
      saveEnglishProgress(stub(result), {
        minigame: 'alphabet',
        level: 1,
        correctCount: 8,
        incorrectCount: 2,
        timeSpentSecs: 60,
      })
    ).resolves.toEqual(result)
  })
})

describe('api-client throws on malformed responses', () => {
  it('getSchedule throws when homework is not an array', async () => {
    const bad = { date: '2026-08-04', schoolPeriods: [], eveningBlocks: [], cancelledIds: [], homework: {} }
    await expect(getSchedule(stub(bad))).rejects.toThrow()
  })

  it('getGrades throws when averageScore is missing', async () => {
    await expect(getGrades(stub({ userId: 'u', grades: [] }))).rejects.toThrow()
  })

  it('getMathBestScores throws when a score level is out of range', async () => {
    const bad = [{ gameType: 'math', level: 9, score: 10, starsEarned: 1, achievedAt: 'x' }]
    await expect(getMathBestScores(stub(bad))).rejects.toThrow()
  })

  it('saveMathProgress throws when the result shape is wrong', async () => {
    await expect(
      saveMathProgress(stub({ score: 'not-a-number' }), {
        minigame: 'addition',
        level: 1,
        correctCount: 8,
        incorrectCount: 2,
        timeSpentSecs: 60,
      })
    ).rejects.toThrow()
  })
})
