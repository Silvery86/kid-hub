import { UpdatePeriodSchema } from '@kid-hub/shared'
import * as scheduleService from '@/server/services/schedule.service'
import { badRequest, ok, serverError } from '@/app/api/v1/_lib/respond'

import { guardStudent } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string; id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { studentId, id } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const parsed = UpdatePeriodSchema.safeParse({ ...body, id })
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  try {
    // A one-sided time edit passes the schema — check the merged range against
    // the stored row, exactly as updatePeriodAction does.
    const { startTime, endTime } = parsed.data
    if ((startTime == null) !== (endTime == null)) {
      const stored = await scheduleService.getPeriodTimes(id, studentId)
      if (!stored) return badRequest('Period not found')
      const mergedStart = startTime ?? stored.startTime
      const mergedEnd = endTime ?? stored.endTime
      if (mergedEnd <= mergedStart) return badRequest('Giờ kết thúc phải sau giờ bắt đầu')
    }

    await scheduleService.updatePeriod({ ...parsed.data, studentId: studentId })
    return ok({ saved: true })
  } catch {
    return serverError('Failed to update period')
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const { studentId, id } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  if (!id) return badRequest('Invalid period ID')

  try {
    await scheduleService.deletePeriod(id, studentId)
    return ok({ deleted: true })
  } catch {
    return serverError('Failed to delete period')
  }
}
