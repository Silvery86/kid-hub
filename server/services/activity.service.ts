import 'server-only'

import {
  logActivity,
  getRecentActivity,
  type ActivityEventRow,
} from '@/server/repositories/activity.repository'

export interface ActivityGroup {
  date: string // 'YYYY-MM-DD'
  items: ActivityEventRow[]
}

/** Records a kid-side event. Fire-and-forget safe — call with void. */
export const recordActivity = async (
  userId: string,
  type: string,
  label: string,
  iconKey?: string
): Promise<void> => {
  await logActivity(userId, type, label, iconKey)
}

/**
 * Fetches recent activity events. Caps limit at 100 to prevent runaway queries.
 * Default is 20 items.
 */
export const fetchRecentActivity = async (
  userId: string,
  limit = 20
): Promise<ActivityEventRow[]> => {
  const capped = Math.min(Math.max(1, limit), 100)
  return getRecentActivity(userId, capped)
}

/** Fetches recent activity and groups rows by calendar date, newest date first. */
export const fetchRecentActivityGrouped = async (
  userId: string,
  limit = 20
): Promise<ActivityGroup[]> => {
  const rows = await fetchRecentActivity(userId, limit)
  const map = new Map<string, ActivityEventRow[]>()
  for (const row of rows) {
    const date = row.createdAt.toISOString().split('T')[0]!
    const bucket = map.get(date) ?? []
    bucket.push(row)
    map.set(date, bucket)
  }
  return Array.from(map.entries())
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => b.date.localeCompare(a.date))
}
