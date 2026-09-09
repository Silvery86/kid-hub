// Pure time helpers — isomorphic.

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
