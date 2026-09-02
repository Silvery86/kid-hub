import { z } from 'zod'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { requireParentApi } from '@/server/lib/api-auth'
import * as scheduleService from '@/server/services/schedule.service'
import { badRequest, ok, serverError, unauthorized } from '../../../../_lib/respond'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

/**
 * A cancellation is a per-date override rather than an edit to the recurring
 * block, so cancelling and restoring are POST and DELETE on the same path.
 */
export async function POST(req: Request, { params }: Params) {
  if (!(await requireParentApi(req))) return unauthorized()

  const { id } = await params
  const body = (await req.json().catch(() => null)) as { date?: unknown; reason?: unknown } | null
  const date = DateSchema.safeParse(body?.date)
  if (!id || !date.success) return badRequest()

  try {
    const reason = typeof body?.reason === 'string' ? body.reason : undefined
    await scheduleService.createOverride(id, DEFAULT_USER_ID, date.data, reason)
    return ok({ cancelled: true })
  } catch {
    return serverError('Failed to cancel class')
  }
}

export async function DELETE(req: Request, { params }: Params) {
  if (!(await requireParentApi(req))) return unauthorized()

  const { id } = await params
  const date = DateSchema.safeParse(new URL(req.url).searchParams.get('date'))
  if (!id || !date.success) return badRequest()

  try {
    await scheduleService.deleteOverride(id, DEFAULT_USER_ID, date.data)
    return ok({ restored: true })
  } catch {
    return serverError('Failed to restore class')
  }
}
