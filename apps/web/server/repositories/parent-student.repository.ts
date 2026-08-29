/**
 * Server-only module — Prisma queries for the parent↔student join.
 * No business logic in this layer — pure data access only.
 *
 * A row here is the authorization edge: a parent may touch a student's data if
 * and only if this table says so.
 */

import { db } from '@/lib/db'

/** True when this parent is linked to this student. */
export const isLinked = async (parentId: string, studentId: string): Promise<boolean> => {
  const row = await db.parentStudent.findUnique({
    where: { parentId_studentId: { parentId, studentId } },
    select: { id: true },
  })
  return row !== null
}

/** Lists the students this parent is linked to, oldest link first. */
export const listStudentsForParent = async (parentId: string) => {
  const rows = await db.parentStudent.findMany({
    where: { parentId },
    orderBy: { createdAt: 'asc' },
    select: {
      role: true,
      student: { select: { id: true, name: true, gradeLevel: true, avatarUrl: true } },
    },
  })
  return rows.map((row) => ({ ...row.student, role: row.role }))
}

/** Links a parent to a student. Idempotent. */
export const link = async (
  parentId: string,
  studentId: string,
  role: 'OWNER' | 'GUARDIAN' = 'OWNER'
): Promise<void> => {
  await db.parentStudent.upsert({
    where: { parentId_studentId: { parentId, studentId } },
    create: { parentId, studentId, role },
    update: {},
  })
}
