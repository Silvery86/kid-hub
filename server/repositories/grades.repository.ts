// Server-only module — all Prisma queries for grade data live here.
// No business logic in this layer — pure data access only.
// TODO Sprint 3: Requires Prisma client setup (see schedule.repository.ts).

// import { db } from '@/lib/db';
// import type { SubjectGrade, ReportCard } from '@/types';

export const getReportCard = async (_userId: string): Promise<null> => {
  // TODO Sprint 3: db.subjectGrade.findMany({ where: { userId: _userId } })
  return null;
};

export const upsertGrade = async (_data: unknown): Promise<void> => {
  // TODO Sprint 3: db.subjectGrade.upsert({ where: { ... }, create: _data, update: _data })
};
