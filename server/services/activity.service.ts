import 'server-only'

import {
  logActivity,
  getRecentActivity,
  type ActivityEventRow,
} from '@/server/repositories/activity.repository'

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
