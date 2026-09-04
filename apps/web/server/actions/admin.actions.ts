'use server'

/**
 * The account review queue.
 *
 * Signup is open (D4), so every application lands here and stays PENDING until
 * an admin decides. Every action is behind requireAdminSession — a parent
 * session is not enough.
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminSession } from '@/server/lib/auth-guard'
import {
  approveParent,
  listParentsByStatus,
  rejectParent,
  suspendParent,
} from '@/server/services/auth.service'
import type { ActionResult, ActionVoidResult } from '@/types'

export type AccountStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'

export interface AccountRow {
  id: string
  email: string
  displayName: string | null
  status: AccountStatus
  createdAt: Date
}

const StatusSchema = z.enum(['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'])
const ReviewSchema = z.object({
  parentId: z.string().min(1),
  note: z.string().trim().max(200, 'Ghi chú tối đa 200 ký tự').optional(),
})

/** Accounts in one state. Defaults to the ones nobody has decided on. */
export const listAccountsAction = async (
  status: AccountStatus = 'PENDING'
): Promise<ActionResult<AccountRow[]>> => {
  const parsed = StatusSchema.safeParse(status)
  if (!parsed.success) return { success: false, error: 'Trạng thái không hợp lệ' }

  try {
    await requireAdminSession()
    const rows = (await listParentsByStatus(parsed.data)) as AccountRow[]
    return { success: true, data: rows }
  } catch (err) {
    return { success: false, error: adminError(err, 'Không tải được danh sách tài khoản') }
  }
}

/** Activates an applicant and creates the student they applied with. */
export const approveAccountAction = async (input: unknown): Promise<ActionVoidResult> => {
  const parsed = ReviewSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Dữ liệu không hợp lệ' }

  try {
    const { parentId: adminId } = await requireAdminSession()
    await approveParent(adminId, parsed.data.parentId)
    revalidatePath('/parent/admin/approvals')
    return { success: true }
  } catch (err) {
    return { success: false, error: adminError(err, 'Không duyệt được tài khoản') }
  }
}

/** Refuses an applicant. The note is shown to them at their next login attempt. */
export const rejectAccountAction = async (input: unknown): Promise<ActionVoidResult> => {
  const parsed = ReviewSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Dữ liệu không hợp lệ' }

  try {
    const { parentId: adminId } = await requireAdminSession()
    await rejectParent(adminId, parsed.data.parentId, parsed.data.note)
    revalidatePath('/parent/admin/approvals')
    return { success: true }
  } catch (err) {
    return { success: false, error: adminError(err, 'Không từ chối được tài khoản') }
  }
}

/** Disables an approved account and drops its devices immediately. */
export const suspendAccountAction = async (input: unknown): Promise<ActionVoidResult> => {
  const parsed = ReviewSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Dữ liệu không hợp lệ' }

  try {
    const { parentId: adminId } = await requireAdminSession()
    await suspendParent(adminId, parsed.data.parentId, parsed.data.note)
    revalidatePath('/parent/admin/approvals')
    return { success: true }
  } catch (err) {
    // The last-admin guard lives in the service; surface its reason verbatim.
    if (err instanceof Error && err.message === 'Cannot suspend the last admin') {
      return { success: false, error: 'Không thể vô hiệu hóa quản trị viên cuối cùng' }
    }
    return { success: false, error: adminError(err, 'Không vô hiệu hóa được tài khoản') }
  }
}

const adminError = (err: unknown, fallback: string): string => {
  const msg = err instanceof Error ? err.message : ''
  if (msg === 'Forbidden') return 'Bạn không có quyền quản trị'
  if (msg === 'Unauthorized') return 'Phiên đăng nhập đã hết hạn'
  return fallback
}
