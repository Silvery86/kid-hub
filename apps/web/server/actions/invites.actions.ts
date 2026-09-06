'use server'

/**
 * Second-parent invites and signed-in devices.
 *
 * An invite code is shown to the issuer exactly once. Only its hash is stored,
 * so nothing here can recover a live code — including this layer.
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireParentSession } from '@/server/lib/auth-guard'
import {
  acceptInvite,
  createInvite,
  listDevices,
  listInvitesForStudent,
  revokeDevice,
  revokeInvite,
  type AcceptInviteResult,
} from '@/server/services/auth.service'
import type { ActionResult, ActionVoidResult } from '@/types'

export interface DeviceRow {
  id: string
  deviceLabel: string | null
  createdAt: Date
  lastUsedAt: Date
  expiresAt: Date
}

export interface InviteRow {
  id: string
  email: string | null
  expiresAt: Date
  acceptedAt: Date | null
  createdAt: Date
}

const CreateInviteSchema = z.object({
  studentId: z.string().min(1),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ').optional().or(z.literal('')),
})

/** Raises an invite. The returned code is the only time it exists in the clear. */
export const createInviteAction = async (
  input: unknown
): Promise<ActionResult<{ code: string; expiresAt: Date }>> => {
  const parsed = CreateInviteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }
  }

  try {
    const { parentId } = await requireParentSession()
    const email = parsed.data.email || undefined
    const invite = await createInvite(parentId, parsed.data.studentId, email)
    revalidatePath('/parent/students')
    return { success: true, data: invite }
  } catch (err) {
    if (err instanceof Error && err.message === 'Forbidden') {
      return { success: false, error: 'Bạn không có quyền với bé này' }
    }
    return { success: false, error: 'Không tạo được mã mời' }
  }
}

/** Redeems a code, linking the signed-in parent to the student as GUARDIAN. */
export const acceptInviteAction = async (
  code: string
): Promise<ActionResult<AcceptInviteResult>> => {
  const parsed = z.string().trim().min(4).max(32).safeParse(code)
  if (!parsed.success) return { success: false, error: 'Mã mời không hợp lệ' }

  try {
    const { parentId } = await requireParentSession()
    const result = await acceptInvite(parentId, parsed.data)
    if (result.status === 'ok') revalidatePath('/parent/students')
    return { success: true, data: result }
  } catch {
    return { success: false, error: 'Không dùng được mã mời' }
  }
}

export const listInvitesAction = async (
  studentId: string
): Promise<ActionResult<InviteRow[]>> => {
  try {
    const { parentId } = await requireParentSession()
    const rows = (await listInvitesForStudent(parentId, studentId)) as InviteRow[]
    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Không tải được danh sách mời' }
  }
}

export const revokeInviteAction = async (inviteId: string): Promise<ActionVoidResult> => {
  const parsed = z.string().min(1).safeParse(inviteId)
  if (!parsed.success) return { success: false, error: 'Mã mời không hợp lệ' }

  try {
    const { parentId } = await requireParentSession()
    await revokeInvite(parentId, parsed.data)
    revalidatePath('/parent/students')
    return { success: true }
  } catch {
    return { success: false, error: 'Không thu hồi được mã mời' }
  }
}

// ── Devices ──────────────────────────────────────────────────────────────────

export const listDevicesAction = async (): Promise<ActionResult<DeviceRow[]>> => {
  try {
    const { parentId } = await requireParentSession()
    return { success: true, data: (await listDevices(parentId)) as DeviceRow[] }
  } catch {
    return { success: false, error: 'Không tải được danh sách thiết bị' }
  }
}

/** Signs out one device. Ownership is enforced by the repository's WHERE clause. */
export const revokeDeviceAction = async (tokenId: string): Promise<ActionVoidResult> => {
  const parsed = z.string().min(1).safeParse(tokenId)
  if (!parsed.success) return { success: false, error: 'Thiết bị không hợp lệ' }

  try {
    const { parentId } = await requireParentSession()
    const revoked = await revokeDevice(parentId, parsed.data)
    if (!revoked) return { success: false, error: 'Không tìm thấy thiết bị này' }
    revalidatePath('/parent/devices')
    return { success: true }
  } catch {
    return { success: false, error: 'Không đăng xuất được thiết bị' }
  }
}
