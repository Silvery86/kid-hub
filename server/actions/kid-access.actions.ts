'use server'

import { requireParentSession } from '@/server/lib/auth-guard'
import { KidAccessSettingsSchema } from '@/server/lib/schemas'
import {
  fetchKidAccessSettings,
  persistKidAccessSettings,
} from '@/server/services/user.service'
import {
  fetchRecentActivity,
  fetchRecentActivityGrouped,
  type ActivityGroup as ServiceActivityGroup,
} from '@/server/services/activity.service'
import type { ActivityEventRow } from '@/server/repositories/activity.repository'
import { DEFAULT_USER_ID } from '@/lib/constants'

/** Returns saved feature toggle state. Null means the parent hasn't customised yet — use defaults. */
export const getKidAccessSettingsAction = async (): Promise<{
  success: boolean
  data?: Record<string, boolean> | null
  error?: string
}> => {
  try {
    await requireParentSession()
    const settings = await fetchKidAccessSettings(DEFAULT_USER_ID)
    return { success: true, data: settings }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load settings'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

export interface ActivityItem {
  id: string
  type: string
  label: string
  iconKey: string | null
  createdAt: string // ISO string — serialisable across server/client boundary
}

export interface ActivityGroup {
  date: string
  items: ActivityItem[]
}

/** Parent-facing: returns the last N kid activity events, newest first. */
export const getRecentActivityAction = async (
  limit = 10
): Promise<{ success: boolean; data?: ActivityItem[]; error?: string }> => {
  try {
    await requireParentSession()
    const rows: ActivityEventRow[] = await fetchRecentActivity(DEFAULT_USER_ID, limit)
    return {
      success: true,
      data: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch activity'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/** Parent-facing: returns activity events grouped by calendar date, newest date first. */
export const getGroupedActivityAction = async (
  limit = 20
): Promise<{ success: boolean; data?: ActivityGroup[]; error?: string }> => {
  try {
    await requireParentSession()
    const groups: ServiceActivityGroup[] = await fetchRecentActivityGrouped(DEFAULT_USER_ID, limit)
    return {
      success: true,
      data: groups.map(({ date, items }) => ({
        date,
        items: items.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      })),
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch activity'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/** Persists the full toggle state map to the database. */
export const saveKidAccessSettingsAction = async (
  settings: unknown
): Promise<{ success: boolean; error?: string }> => {
  try {
    await requireParentSession()
    const parsed = KidAccessSettingsSchema.safeParse(settings)
    if (!parsed.success) return { success: false, error: 'Invalid settings format' }
    await persistKidAccessSettings(DEFAULT_USER_ID, parsed.data)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save settings'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}
