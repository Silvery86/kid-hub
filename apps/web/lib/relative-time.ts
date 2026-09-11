/**
 * "3 phút trước" — how long ago, in words.
 *
 * A notification's exact clock time is almost never the point; how recent it is,
 * is. Pure and takes `now` explicitly so the boundaries can be tested rather
 * than guessed at.
 */

export const relativeTime = (iso: string, now: Date = new Date()): string => {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''

  // A clock skewed slightly ahead of the server should read as "just now",
  // never as a negative duration.
  const seconds = Math.max(0, Math.round((now.getTime() - then) / 1000))

  if (seconds < 60) return 'vừa xong'

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`

  const days = Math.round(hours / 24)
  if (days === 1) return 'hôm qua'
  return `${days} ngày trước`
}
