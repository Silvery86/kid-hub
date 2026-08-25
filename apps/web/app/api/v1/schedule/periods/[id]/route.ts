import { UpdatePeriodSchema } from '@kid-hub/shared'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { requireParentApi } from '@/server/lib/api-auth'
import * as scheduleService from '@/server/services/schedule.service'
import { badRequest, ok, serverError, unauthorized } from '../../../_lib/respond'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  if (!(await requireParentApi(req))) return unauthorized()

  const { id } = await params
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const parsed = UpdatePeriodSchema.safeParse({ ...body, id })
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  try {
    // A one-sided time edit passes the schema — check the merged range against
    // the stored row, exactly as updatePeriodAction does.
    const { startTime, endTime } = parsed.data
    if ((startTime == null) !== (endTime == null)) {
      const stored = await scheduleService.getPeriodTimes(id, DEFAULT_USER_ID)
      if (!stored) return badRequest('Period not found')
      const mergedStart = startTime ?? stored.startTime
      const mergedEnd = endTime ?? stored.endTime
      if (mergedEnd <= mergedStart) return badRequest('Giờ kết thúc phải sau giờ bắt đầu')
    }

    await scheduleService.updatePeriod({ ...parsed.data, userId: DEFAULT_USER_ID })
    return ok({ saved: true })
  } catch {
    return serverError('Failed to update period')
  }
}

export async function DELETE(req: Request, { params }: Params) {
  if (!(await requireParentApi(req))) return unauthorized()

  const { id } = await params
  if (!id) return badRequest('Invalid period ID')

  try {
    await scheduleService.deletePeriod(id, DEFAULT_USER_ID)
    return ok({ deleted: true })
  } catch {
    return serverError('Failed to delete period')
  }
}
