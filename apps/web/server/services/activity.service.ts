import 'server-only'

import {
  logActivity,
  getRecentActivity,
  type ActivityEventRow,
} from '@/server/repositories/activity.repository'
export type { ActivityEventRow }

/** Records a kid-side event. Fire-and-forget safe — call with void. */
export const recordActivity = async (
  studentId: string,
  type: string,
  label: string,
  iconKey?: string
): Promise<void> => {
  await logActivity(studentId, type, label, iconKey)
}

/**
 * Fetches recent activity events. Caps limit at 100 to prevent runaway queries.
 * Default is 20 items.
 */
export const fetchRecentActivity = async (
  studentId: string,
  limit = 20
): Promise<ActivityEventRow[]> => {
  const capped = Math.min(Math.max(1, limit), 100)
  return getRecentActivity(studentId, capped)
}
