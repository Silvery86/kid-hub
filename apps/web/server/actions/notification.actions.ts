'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireParentSession } from '@/server/lib/auth-guard'
import * as notificationService from '@/server/services/notification.service'
import type { ActionResult } from '@/types'

/**
 * Guard, validate, orchestrate. Who may read a notification is decided in the
 * repository by joining parent_students — this layer only establishes who is
 * calling and hands that id down.
 */

export interface NotificationView {
  id: string
  studentId: string
  type: string
  label: string
  iconKey: string | null
  href: string | null
  isRead: boolean
  createdAt: string
}

const IdsSchema = z.array(z.string().min(1)).max(100)

export const getNotificationsAction = async (
  limit = 20
): Promise<ActionResult<NotificationView[]>> => {
  try {
    const { parentId } = await requireParentSession()
    const rows = await notificationService.getNotifications(parentId, limit)
    return {
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        type: r.type,
        label: r.label,
        iconKey: r.iconKey,
        href: r.href,
        isRead: r.readAt !== null,
        // Serialised here: a Date crossing the Server Action boundary arrives as
        // a string anyway, so the contract may as well say so.
        createdAt: r.createdAt.toISOString(),
      })),
    }
  } catch {
    return { success: false, error: 'Không tải được thông báo' }
  }
}

export const getUnreadCountAction = async (): Promise<ActionResult<number>> => {
  try {
    const { parentId } = await requireParentSession()
    return { success: true, data: await notificationService.getUnreadCount(parentId) }
  } catch {
    return { success: false, error: 'Không đếm được thông báo' }
  }
}

export const markNotificationsReadAction = async (
  ids: string[]
): Promise<ActionResult<{ updated: number }>> => {
  try {
    const { parentId } = await requireParentSession()
    const parsed = IdsSchema.safeParse(ids)
    if (!parsed.success) return { success: false, error: 'Danh sách không hợp lệ' }

    const updated = await notificationService.markNotificationsRead(parentId, parsed.data)
    revalidatePath('/parent')
    return { success: true, data: { updated } }
  } catch {
    return { success: false, error: 'Không cập nhật được thông báo' }
  }
}

export const markAllNotificationsReadAction = async (): Promise<
  ActionResult<{ updated: number }>
> => {
  try {
    const { parentId } = await requireParentSession()
    const updated = await notificationService.markAllNotificationsRead(parentId)
    revalidatePath('/parent')
    return { success: true, data: { updated } }
  } catch {
    return { success: false, error: 'Không cập nhật được thông báo' }
  }
}
