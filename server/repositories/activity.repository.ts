/** Server-only — ActivityEvent data access. No business logic. */

import { db } from '@/lib/db'

export interface ActivityEventRow {
  id: string
  type: string
  label: string
  iconKey: string | null
  createdAt: Date
}

/**
 * Logs a significant kid-side event. Fire-and-forget safe — errors are caught inside.
 * Call without `await` to avoid blocking the parent action.
 */
export const logActivity = async (
  userId: string,
  type: string,
  label: string,
  iconKey?: string
): Promise<void> => {
  await db.activityEvent.create({
    data: { userId, type, label, iconKey: iconKey ?? null },
  })
}

/** Returns the most recent N activity events for a user, newest first. */
export const getRecentActivity = async (
  userId: string,
  limit = 10
): Promise<ActivityEventRow[]> => {
  return db.activityEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, type: true, label: true, iconKey: true, createdAt: true },
  })
}
