// Pure time helpers — isomorphic.

import { SCHOOL_TIME_ZONE } from '../constants'

/** Parse an "HH:MM" 24-hour time string to minutes past midnight. */
export const parseTimeToMinutes = (time: string): number => {
  const [h, m] = time.split(':')
  return parseInt(h ?? '0', 10) * 60 + parseInt(m ?? '0', 10)
}

/** Format minutes past midnight back to a zero-padded "HH:MM". */
export const formatMinutesToTime = (minutes: number): string => {
  const wrapped = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * "Now" as the school experiences it — date and minutes past midnight in
 * SCHOOL_TIME_ZONE, not in whatever zone the process happens to run in.
 *
 * Used identically on the server (UTC) and in the browser (local), so both
 * agree on whether tiết 5 has started. Intl does the conversion; there is no
 * timezone table to keep up to date and no dependency to add.
 */
export const nowInSchoolZone = (now: Date = new Date()): {
  dateIso: string
  minutes: number
} => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SCHOOL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '00'
  // "24" appears at midnight in some ICU versions; normalise it to 0.
  const hour = Number(get('hour')) % 24
  return {
    dateIso: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: hour * 60 + Number(get('minute')),
  }
}
