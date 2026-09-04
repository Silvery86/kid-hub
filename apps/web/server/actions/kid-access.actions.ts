'use server'

import { z } from 'zod'
import { resolveActiveStudent } from '@/server/lib/auth-guard'
import { getKidAccessSettings, saveKidAccessSettings } from '@/server/services/user.service'
import { fetchRecentActivity } from '@/server/services/activity.service'
import type { ActivityEventRow } from '@/server/services/activity.service'
import type { ActionResult, ActionVoidResult } from '@/types'

/** Returns saved feature toggle state. Null means the parent hasn't customised yet — use defaults. */
export const getKidAccessSettingsAction = async (): Promise<ActionResult<Record<string, boolean> | null>> => {
  try {
    const studentId = await resolveActiveStudent()
    const settings = await getKidAccessSettings(studentId)
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

/** Parent-facing: returns the last N kid activity events, newest first. */
export const getRecentActivityAction = async (
  limit = 10
): Promise<ActionResult<ActivityItem[]>> => {
  try {
    const studentId = await resolveActiveStudent()
    const rows: ActivityEventRow[] = await fetchRecentActivity(studentId, limit)
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

const SettingsSchema = z.record(z.string(), z.boolean())

/** Persists the full toggle state map to the database. */
export const saveKidAccessSettingsAction = async (settings: unknown): Promise<ActionVoidResult> => {
  try {
    const studentId = await resolveActiveStudent()
    const parsed = SettingsSchema.safeParse(settings)
    if (!parsed.success) return { success: false, error: 'Invalid settings format' }
    await saveKidAccessSettings(studentId, parsed.data)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save settings'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}
