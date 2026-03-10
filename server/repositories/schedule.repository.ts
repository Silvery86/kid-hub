// Server-only module — all Prisma queries for schedule data live here.
// No business logic in this layer — pure data access only.
// TODO Sprint 2: Install Prisma (`npm install prisma @prisma/client`)
//               and run `npx prisma init` to generate the client.

// import { db } from '@/lib/db';
// import type { ClassPeriod, WeeklySchedule } from '@/types';

export const getWeeklySchedule = async (): Promise<null> => {
  // TODO Sprint 2: return db.weeklySchedule.findFirst({ include: { days: { include: { periods: true } } } });
  return null;
};

export const getTodaySchedule = async (): Promise<null> => {
  // TODO Sprint 2: query by today's DayOfWeek
  return null;
};

export const createPeriod = async (_data: unknown): Promise<void> => {
  // TODO Sprint 2: db.classPeriod.create({ data: _data })
};

export const updatePeriod = async (_data: unknown): Promise<void> => {
  // TODO Sprint 2: db.classPeriod.update({ where: { id: _data.id }, data: _data })
};

export const deletePeriod = async (_id: string): Promise<void> => {
  // TODO Sprint 2: db.classPeriod.delete({ where: { id: _id } })
};
