import { describe, expect, it } from 'vitest'
import type {
  GameBestScore,
  GameSaveResult,
  HomeworkItem,
  ReportCard,
  TodayView,
} from '../types'
import {
  GameBestScoreArraySchema,
  GameBestScoreSchema,
  GameSaveResultSchema,
  HomeworkItemArraySchema,
  ReportCardSchema,
  TodayViewSchema,
} from './response.schema'

// ── Type sync ────────────────────────────────────────────────────────────────
// These assignments compile only if each schema's inferred type and its contract
// type in ../types are mutually assignable. A drift between the two (a field added
// to the type but not the schema, or vice versa) becomes a type-check failure.
describe('response schemas stay in sync with contract types', () => {
  it('TodayView', () => {
    const fromSchema = {} as import('zod').infer<typeof TodayViewSchema>
    const _a: TodayView = fromSchema
    const _b: import('zod').infer<typeof TodayViewSchema> = {} as TodayView
    expect(_a).toBeDefined()
    expect(_b).toBeDefined()
  })

  it('HomeworkItem', () => {
    const _a: HomeworkItem = {} as import('zod').infer<typeof HomeworkItemArraySchema>[number]
    const _b: import('zod').infer<typeof HomeworkItemArraySchema>[number] = {} as HomeworkItem
    expect(_a).toBeDefined()
    expect(_b).toBeDefined()
  })

  it('ReportCard', () => {
    const _a: ReportCard = {} as import('zod').infer<typeof ReportCardSchema>
    const _b: import('zod').infer<typeof ReportCardSchema> = {} as ReportCard
    expect(_a).toBeDefined()
    expect(_b).toBeDefined()
  })

  it('GameBestScore', () => {
    const _a: GameBestScore = {} as import('zod').infer<typeof GameBestScoreSchema>
    const _b: import('zod').infer<typeof GameBestScoreSchema> = {} as GameBestScore
    expect(_a).toBeDefined()
    expect(_b).toBeDefined()
  })

  it('GameSaveResult', () => {
    const _a: GameSaveResult = {} as import('zod').infer<typeof GameSaveResultSchema>
    const _b: import('zod').infer<typeof GameSaveResultSchema> = {} as GameSaveResult
    expect(_a).toBeDefined()
    expect(_b).toBeDefined()
  })
})

// ── Runtime fixtures ─────────────────────────────────────────────────────────
describe('response schemas accept valid wire payloads', () => {
  it('TodayViewSchema parses a full today view', () => {
    const payload: TodayView = {
      date: '2026-08-04',
      schoolPeriods: [
        {
          id: 'p1',
          periodNumber: 1,
          eventType: 'SCHOOL_PERIOD',
          subjectId: 'math',
          startTime: '08:00',
          endTime: '08:45',
          roomNumber: '1A',
        },
      ],
      eveningBlocks: [
        { eventType: 'EXTRA_CLASS', subjectId: 'english', startTime: '18:00', endTime: '19:00' },
      ],
      cancelledIds: ['x1'],
      homework: [
        { id: 'h1', date: '2026-08-04', subjectId: 'math', label: 'Trang 12', isDone: false, points: 10 },
      ],
    }
    expect(TodayViewSchema.parse(payload)).toEqual(payload)
  })

  it('HomeworkItemArraySchema parses homework items (empty doneAt allowed)', () => {
    const payload: HomeworkItem[] = [
      { periodId: 'h1', subjectId: 'math', homeworkNote: 'Trang 12', startTime: '', isDone: false },
      {
        periodId: 'h2',
        subjectId: 'english',
        homeworkNote: 'Đọc bài',
        startTime: '',
        isDone: true,
        doneAt: '2026-08-04T10:00:00.000Z',
      },
    ]
    expect(HomeworkItemArraySchema.parse(payload)).toEqual(payload)
  })

  it('ReportCardSchema parses a report card', () => {
    const payload: ReportCard = {
      userId: 'khoi-default-user',
      averageScore: 8.5,
      grades: [
        { subjectId: 'math', score: 9, badge: 'excellent', semester: 1, academicYear: '2025-2026' },
      ],
    }
    expect(ReportCardSchema.parse(payload)).toEqual(payload)
  })

  it('GameBestScoreArraySchema parses best scores with ISO achievedAt', () => {
    const payload: GameBestScore[] = [
      {
        gameType: 'math',
        level: 2,
        score: 180,
        starsEarned: 3,
        achievedAt: '2026-08-04T10:00:00.000Z',
        subType: 'addition',
      },
    ]
    expect(GameBestScoreArraySchema.parse(payload)).toEqual(payload)
  })

  it('GameSaveResultSchema parses a save result', () => {
    const payload: GameSaveResult = { starsEarned: 2, score: 120, pointsEarned: 40, isNewBest: true }
    expect(GameSaveResultSchema.parse(payload)).toEqual(payload)
  })
})

// ── Rejections ───────────────────────────────────────────────────────────────
describe('response schemas reject malformed payloads', () => {
  it('rejects a best score whose level is out of range', () => {
    const bad = { gameType: 'math', level: 4, score: 10, starsEarned: 1, achievedAt: 'x' }
    expect(GameBestScoreSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects a best score with a numeric (non-ISO-string) achievedAt', () => {
    // Guards against the server accidentally sending a Date/number instead of a string.
    const bad = { gameType: 'math', level: 1, score: 10, starsEarned: 1, achievedAt: 1234567890 }
    expect(GameBestScoreSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects a report card missing averageScore', () => {
    const bad = { userId: 'u', grades: [] }
    expect(ReportCardSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects a today view whose homework is not an array', () => {
    const bad = { date: '2026-08-04', schoolPeriods: [], eveningBlocks: [], cancelledIds: [], homework: {} }
    expect(TodayViewSchema.safeParse(bad).success).toBe(false)
  })
})
