'use server'

/** Server Actions for subject grades — fetch report card and upsert individual grades. */

import { revalidatePath } from 'next/cache'

// TODO Sprint 3: uncomment when Prisma + auth are set up
// import { validateParentSession } from '@/server/services/auth.service';
// import { calculateBadge } from '@/server/services/grades.service';
// import * as gradesRepo from '@/server/repositories/grades.repository';

/** Retrieves the full report card for the specified user. */
export const getReportCardAction = async (
  _userId: string
): Promise<{ success: boolean; data?: null; error?: string }> => {
  // TODO Sprint 3: return { success: true, data: await gradesRepo.getReportCard(_userId) }
  return { success: true, data: null }
}

/** Creates or updates a subject grade entry for a user. Revalidates grades and dashboard paths. */
export const upsertGradeAction = async (
  _data: unknown
): Promise<{ success: boolean; error?: string }> => {
  // TODO Sprint 3:
  // await validateParentSession();
  // const withBadge = { ..._data, badge: calculateBadge(_data.score) };
  // await gradesRepo.upsertGrade(withBadge);
  revalidatePath('/grades')
  revalidatePath('/dashboard')
  return { success: true }
}
