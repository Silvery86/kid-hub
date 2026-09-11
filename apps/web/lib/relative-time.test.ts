import { describe, it, expect } from 'vitest'
import { relativeTime } from './relative-time'

const NOW = new Date('2026-09-11T12:00:00.000Z')
const ago = (ms: number): string => new Date(NOW.getTime() - ms).toISOString()

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('relativeTime', () => {
  it('calls anything under a minute "vừa xong"', () => {
    expect(relativeTime(ago(0), NOW)).toBe('vừa xong')
    expect(relativeTime(ago(59 * SECOND), NOW)).toBe('vừa xong')
  })

  it('counts minutes, then hours, then days', () => {
    expect(relativeTime(ago(5 * MINUTE), NOW)).toBe('5 phút trước')
    expect(relativeTime(ago(3 * HOUR), NOW)).toBe('3 giờ trước')
    expect(relativeTime(ago(4 * DAY), NOW)).toBe('4 ngày trước')
  })

  it('says "hôm qua" rather than "1 ngày trước"', () => {
    expect(relativeTime(ago(DAY), NOW)).toBe('hôm qua')
  })

  it('reads a clock skewed into the future as just now, not a negative age', () => {
    const future = new Date(NOW.getTime() + 30 * SECOND).toISOString()
    expect(relativeTime(future, NOW)).toBe('vừa xong')
  })

  it('returns nothing for a value that is not a date', () => {
    expect(relativeTime('not-a-date', NOW)).toBe('')
  })
})
