'use server'

/**
 * Server Actions for weekly schedule: query and CRUD operations on class periods.
 * All mutations are validated with Zod and guarded by parent session check.
 */

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { verifySessionToken, SESSION_COOKIE } from '@/server/services/auth.service'
import { validatePeriodOverlap } from '@/server/services/schedule.service'
import * as scheduleRepo from '@/server/repositories/schedule.repository'
import type { DayOfWeek, DailySchedule } from '@/types'
import { DEFAULT_USER_ID } from '@/lib/constants'

const DaySchema = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])

const CreatePeriodSchema = z.object({
  day: DaySchema,
  periodNumber: z.number().int().min(1).max(10),
  subjectId: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  roomNumber: z.string().optional(),
})

const UpdatePeriodSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  roomNumber: z.string().optional(),
})

/** Ensures the request comes from an authenticated parent session. */
const requireParentSession = async (): Promise<void> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) throw new Error('Unauthorized')
  const session = await verifySessionToken(token)
  if (!session) throw new Error('Unauthorized')
}

/** Retrieves the weekly schedule, optionally filtered to a specific day. */
export const getScheduleAction = async (
  day?: DayOfWeek
): Promise<{ success: boolean; data?: DailySchedule[]; error?: string }> => {
  try {
    if (day) {
      const result = await scheduleRepo.getDaySchedule(DEFAULT_USER_ID, day)
      return { success: true, data: result ? [result] : [] }
    }
    const data = await scheduleRepo.getWeeklySchedule(DEFAULT_USER_ID)
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to fetch schedule' }
  }
}

/** Creates a new class period. Validates overlap and revalidates affected paths. */
export const createPeriodAction = async (
  input: unknown
): Promise<{ success: boolean; error?: string }> => {
  try {
    await requireParentSession()
    const parsed = CreatePeriodSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }
    const data = parsed.data
    const existing = await scheduleRepo.getDaySchedule(DEFAULT_USER_ID, data.day as DayOfWeek)
    const newPeriod = {
      periodNumber: data.periodNumber,
      subjectId: data.subjectId,
      startTime: data.startTime,
      endTime: data.endTime,
    }
    if (existing && validatePeriodOverlap(newPeriod, existing.periods)) {
      return { success: false, error: 'This time slot overlaps with an existing period' }
    }
    await scheduleRepo.createPeriod({ ...data, userId: DEFAULT_USER_ID, day: data.day as DayOfWeek })
    revalidatePath('/dashboard')
    revalidatePath('/schedule')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create period'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/** Updates an existing class period by ID. Revalidates affected paths. */
export const updatePeriodAction = async (
  input: unknown
): Promise<{ success: boolean; error?: string }> => {
  try {
    await requireParentSession()
    const parsed = UpdatePeriodSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message }
    }
    await scheduleRepo.updatePeriod(parsed.data)
    revalidatePath('/dashboard')
    revalidatePath('/schedule')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update period'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/** Deletes a class period by ID. Revalidates affected paths. */
export const deletePeriodAction = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await requireParentSession()
    const parsed = z.string().min(1).safeParse(id)
    if (!parsed.success) {
      return { success: false, error: 'Invalid period ID' }
    }
    await scheduleRepo.deletePeriod(parsed.data)
    revalidatePath('/dashboard')
    revalidatePath('/schedule')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete period'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}
