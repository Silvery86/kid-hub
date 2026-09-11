import 'server-only'

import { BADGE_DEFINITIONS } from '@kid-hub/shared'
import {
  createNotification,
  listForParent,
  markAllRead,
  markRead,
  parentIdsForStudent,
  unreadCount,
  type NotificationRow,
} from '@/server/repositories/notification.repository'

export type { NotificationRow }

/**
 * Who receives what, and what it says.
 *
 * The filter is deliberately tight. A notification centre that fills with noise
 * is ignored inside a week, so every game result and every lesson edit stays a
 * log row (parentId NULL) and only the events below become inbox entries.
 *
 * Every notifier is safe to call for a student with several parents: an event
 * about a child goes to each adult who has access, and each gets their own row
 * with their own read state, because "read" is per person.
 */

export const NOTIFICATION_TYPES = {
  BADGE_EARNED: 'BADGE_EARNED',
  HOMEWORK_DONE: 'HOMEWORK_DONE',
  ACCOUNT_DECISION: 'ACCOUNT_DECISION',
} as const

/** Fan one event out to every adult with access to the child. */
const notifyGuardians = async (
  studentId: string,
  build: (parentId: string) => Parameters<typeof createNotification>[0]
): Promise<void> => {
  const parentIds = await parentIdsForStudent(studentId)
  await Promise.all(parentIds.map((parentId) => createNotification(build(parentId))))
}

/** A child earned a badge — the thing to celebrate together. */
export const notifyBadgeEarned = async (
  studentId: string,
  studentName: string,
  badgeId: string
): Promise<void> => {
  const badge = BADGE_DEFINITIONS.find((b) => b.id === badgeId)
  if (!badge) return

  await notifyGuardians(studentId, (parentId) => ({
    studentId,
    parentId,
    type: NOTIFICATION_TYPES.BADGE_EARNED,
    label: `${studentName} vừa nhận huy hiệu ${badge.name}`,
    iconKey: badge.iconEmoji,
    href: '/parent/kid-access',
    // Per recipient, so a second parent still gets their own copy, but a retried
    // save or a re-render cannot write the same badge twice for the same adult.
    dedupeKey: `badge:${badgeId}:${studentId}`,
  }))
}

/** Homework finished. Already a log row; this gives it a recipient and a read state. */
export const notifyHomeworkDone = async (
  studentId: string,
  studentName: string,
  label: string,
  dateKey: string
): Promise<void> => {
  await notifyGuardians(studentId, (parentId) => ({
    studentId,
    parentId,
    type: NOTIFICATION_TYPES.HOMEWORK_DONE,
    label: `${studentName} đã làm xong ${label}`,
    iconKey: '📝',
    href: '/parent',
    // One per child per day: finishing six exercises is one piece of news to a
    // parent, not six.
    dedupeKey: `homework:${dateKey}:${studentId}`,
  }))
}

export const getNotifications = async (parentId: string, limit?: number) =>
  listForParent(parentId, limit)

export const getUnreadCount = async (parentId: string): Promise<number> =>
  unreadCount(parentId)

export const markNotificationsRead = async (parentId: string, ids: string[]): Promise<number> =>
  markRead(parentId, ids)

export const markAllNotificationsRead = async (parentId: string): Promise<number> =>
  markAllRead(parentId)
