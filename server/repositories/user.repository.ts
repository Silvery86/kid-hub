// Server-only module — all Prisma queries for user/auth data live here.
// No business logic in this layer — pure data access only.
// TODO Sprint 3: Requires Prisma client setup (see schedule.repository.ts).

// import { db } from '@/lib/db';
// import type { ParentPin, UserProgress } from '@/types';

/** Retrieves the stored parent PIN hash record. */
export const getPin = async (): Promise<null> => {
  // TODO Sprint 3: db.parentPin.findFirst()
  return null
}

/** Creates or updates the parent PIN hash. */
export const savePin = async (_hash: string): Promise<void> => {
  // TODO Sprint 3: db.parentPin.upsert({ where: { id: 'singleton' }, create: { hash: _hash }, update: { hash: _hash } })
}

/** Retrieves the UserProgress record for the specified user. */
export const getUserProgress = async (_userId: string): Promise<null> => {
  // TODO Sprint 3: db.userProgress.findUnique({ where: { userId: _userId } })
  return null
}

/** Creates or updates a user's progress record. */
export const upsertUserProgress = async (_data: unknown): Promise<void> => {
  // TODO Sprint 3: db.userProgress.upsert(...)
}
