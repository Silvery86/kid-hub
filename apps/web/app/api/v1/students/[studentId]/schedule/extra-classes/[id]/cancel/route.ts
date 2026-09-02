import { z } from 'zod'
import * as scheduleService from '@/server/services/schedule.service'
import { badRequest, ok, serverError } from '@/app/api/v1/_lib/respond'

import { guardStudent } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string; id: string }> }

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

/**
 * A cancellation is a per-date override rather than an edit to the recurring
 * block, so cancelling and restoring are POST and DELETE on the same path.
 */
export async function POST(req: Request, { params }: Params) {
  const { studentId, id } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as { date?: unknown; reason?: unknown } | null
  const date = DateSchema.safeParse(body?.date)
  if (!id || !date.success) return badRequest()

  try {
    const reason = typeof body?.reason === 'string' ? body.reason : undefined
    await scheduleService.createOverride(id, studentId, date.data, reason)
    return ok({ cancelled: true })
  } catch {
    return serverError('Failed to cancel class')
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const { studentId, id } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  const date = DateSchema.safeParse(new URL(req.url).searchParams.get('date'))
  if (!id || !date.success) return badRequest()

  try {
    await scheduleService.deleteOverride(id, studentId, date.data)
    return ok({ restored: true })
  } catch {
    return serverError('Failed to restore class')
  }
}
