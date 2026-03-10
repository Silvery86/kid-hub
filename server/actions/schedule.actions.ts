'use server';

import { revalidatePath } from 'next/cache';
import type { DayOfWeek } from '@/types';

// TODO Sprint 2: uncomment when Prisma + auth are set up
// import { validateParentSession } from '@/server/services/auth.service';
// import { validatePeriodOverlap } from '@/server/services/schedule.service';
// import * as scheduleRepo from '@/server/repositories/schedule.repository';

export const getScheduleAction = async (_day?: DayOfWeek): Promise<null> => {
  // TODO Sprint 2: return scheduleRepo.getWeeklySchedule() or getTodaySchedule(_day)
  return null;
};

export const createPeriodAction = async (
  _data: unknown,
): Promise<{ success: boolean; error?: string }> => {
  // TODO Sprint 2:
  // await validateParentSession();
  // await validatePeriodOverlap(_data, existing);
  // await scheduleRepo.createPeriod(_data);
  revalidatePath('/dashboard');
  revalidatePath('/schedule');
  return { success: true };
};

export const updatePeriodAction = async (
  _data: unknown,
): Promise<{ success: boolean; error?: string }> => {
  // TODO Sprint 2:
  // await validateParentSession();
  // await scheduleRepo.updatePeriod(_data);
  revalidatePath('/dashboard');
  revalidatePath('/schedule');
  return { success: true };
};

export const deletePeriodAction = async (
  _id: string,
): Promise<{ success: boolean; error?: string }> => {
  // TODO Sprint 2:
  // await validateParentSession();
  // await scheduleRepo.deletePeriod(_id);
  revalidatePath('/dashboard');
  revalidatePath('/schedule');
  return { success: true };
};
