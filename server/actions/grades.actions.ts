'use server';

import { revalidatePath } from 'next/cache';

// TODO Sprint 3: uncomment when Prisma + auth are set up
// import { validateParentSession } from '@/server/services/auth.service';
// import { calculateBadge } from '@/server/services/grades.service';
// import * as gradesRepo from '@/server/repositories/grades.repository';

export const getReportCardAction = async (_userId: string): Promise<null> => {
  // TODO Sprint 3: return gradesRepo.getReportCard(_userId)
  return null;
};

export const upsertGradeAction = async (
  _data: unknown,
): Promise<{ success: boolean; error?: string }> => {
  // TODO Sprint 3:
  // await validateParentSession();
  // const withBadge = { ..._data, badge: calculateBadge(_data.score) };
  // await gradesRepo.upsertGrade(withBadge);
  revalidatePath('/grades');
  revalidatePath('/dashboard');
  return { success: true };
};
