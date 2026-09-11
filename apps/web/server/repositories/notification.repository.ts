/** Server-only — notification data access. No business logic. */

import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export interface NotificationRow {
  id: string
  studentId: string
  type: string
  label: string
  iconKey: string | null
  href: string | null
  readAt: Date | null
  createdAt: Date
}

const ROW_FIELDS = {
  id: true,
  studentId: true,
  type: true,
  label: true,
  iconKey: true,
  href: true,
  readAt: true,
  createdAt: true,
} as const

/**
 * The access rule, in one place.
 *
 * `parentId` on the row says who a notification was addressed to. It does NOT
 * say who may read it — per CLAUDE.md, only a parent_students row answers that,
 * and a denormalised column is no more authoritative than a JWT claim.
 *
 * The difference is not theoretical. Revoke a co-parent's access to a child and
 * every notification already written still carries their id; without this join
 * they would keep reading that child's homework and game history until someone
 * noticed. With it, access ends the moment the join row goes.
 */
const addressedAndPermitted = (parentId: string): Prisma.ActivityEventWhereInput => ({
  parentId,
  student: { parents: { some: { parentId } } },
})

/** Inbox for a parent, newest first. */
export const listForParent = async (
  parentId: string,
  limit = 20
): Promise<NotificationRow[]> =>
  db.activityEvent.findMany({
    where: addressedAndPermitted(parentId),
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(1, limit), 100),
    select: ROW_FIELDS,
  })

export const unreadCount = async (parentId: string): Promise<number> =>
  db.activityEvent.count({
    where: { ...addressedAndPermitted(parentId), readAt: null },
  })

/** Marks specific notifications read. Returns how many actually changed. */
export const markRead = async (parentId: string, ids: string[]): Promise<number> => {
  if (ids.length === 0) return 0
  const { count } = await db.activityEvent.updateMany({
    where: { ...addressedAndPermitted(parentId), id: { in: ids }, readAt: null },
    data: { readAt: new Date() },
  })
  return count
}

export const markAllRead = async (parentId: string): Promise<number> => {
  const { count } = await db.activityEvent.updateMany({
    where: { ...addressedAndPermitted(parentId), readAt: null },
    data: { readAt: new Date() },
  })
  return count
}

export interface CreateNotificationInput {
  studentId: string
  parentId: string
  type: string
  label: string
  iconKey?: string
  href?: string
  /** Makes the write idempotent for this recipient. */
  dedupeKey?: string
}

/**
 * Writes one notification, or does nothing if its dedupeKey already exists.
 *
 * createMany with skipDuplicates rather than an upsert: the unique index spans
 * two nullable columns, and the returned count is what tells the caller whether
 * this was a new moment or a repeat.
 */
export const createNotification = async (input: CreateNotificationInput): Promise<boolean> => {
  const { count } = await db.activityEvent.createMany({
    data: [
      {
        studentId: input.studentId,
        parentId: input.parentId,
        type: input.type,
        label: input.label,
        iconKey: input.iconKey ?? null,
        href: input.href ?? null,
        dedupeKey: input.dedupeKey ?? null,
      },
    ],
    skipDuplicates: true,
  })
  return count > 0
}

/** Every parent with access to a student — the recipients of an event about them. */
export const parentIdsForStudent = async (studentId: string): Promise<string[]> => {
  const rows = await db.parentStudent.findMany({
    where: { studentId },
    select: { parentId: true },
  })
  return rows.map((r) => r.parentId)
}
