'use server'

/** Server Actions for weekly schedule — query and CRUD operations on class periods. */

import { revalidatePath } from 'next/cache'
import type { DayOfWeek } from '@/types'

// TODO Sprint 2: uncomment when Prisma + auth are set up
// import { validateParentSession } from '@/server/services/auth.service';
// import { validatePeriodOverlap } from '@/server/services/schedule.service';
// import * as scheduleRepo from '@/server/repositories/schedule.repository';

/** Retrieves the weekly schedule, optionally filtered to a specific day. */
export const getScheduleAction = async (
  _day?: DayOfWeek
): Promise<{ success: boolean; data?: null; error?: string }> => {
  // TODO Sprint 2: return { success: true, data: await scheduleRepo.getWeeklySchedule() or getTodaySchedule(_day) }
  return { success: true, data: null }
}

/** Creates a new class period. Validates overlap and revalidates affected paths. */
export const createPeriodAction = async (
  _data: unknown
): Promise<{ success: boolean; error?: string }> => {
  // TODO Sprint 2:
  // await validateParentSession();
  // await validatePeriodOverlap(_data, existing);
  // await scheduleRepo.createPeriod(_data);
  revalidatePath('/dashboard')
  revalidatePath('/schedule')
  return { success: true }
}

/** Updates an existing class period by ID. Revalidates affected paths. */
export const updatePeriodAction = async (
  _data: unknown
): Promise<{ success: boolean; error?: string }> => {
  // TODO Sprint 2:
  // await validateParentSession();
  // await scheduleRepo.updatePeriod(_data);
  revalidatePath('/dashboard')
  revalidatePath('/schedule')
  return { success: true }
}

/** Deletes a class period by ID. Revalidates affected paths. */
export const deletePeriodAction = async (
  _id: string
): Promise<{ success: boolean; error?: string }> => {
  // TODO Sprint 2:
  // await validateParentSession();
  // await scheduleRepo.deletePeriod(_id);
  revalidatePath('/dashboard')
  revalidatePath('/schedule')
  return { success: true }
}
