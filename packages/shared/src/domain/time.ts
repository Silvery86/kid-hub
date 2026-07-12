// Pure time helpers — isomorphic.

/** Parse an "HH:MM" 24-hour time string to minutes past midnight. */
export const parseTimeToMinutes = (time: string): number => {
  const [h, m] = time.split(':')
  return parseInt(h ?? '0', 10) * 60 + parseInt(m ?? '0', 10)
}
