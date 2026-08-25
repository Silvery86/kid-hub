import { CreateExtraClassSchema, type DayOfWeek } from '@kid-hub/shared'
import { DEFAULT_USER_ID, MAX_EVENING_BLOCKS_PER_DAY } from '@/lib/constants'
import { requireParentApi } from '@/server/lib/api-auth'
import * as scheduleService from '@/server/services/schedule.service'
import { validatePeriodOverlap } from '@/server/services/schedule.service'
import { badRequest, ok, serverError, unauthorized } from '../../_lib/respond'

export const dynamic = 'force-dynamic'

/** Creates a recurring evening class. Enforces the per-day cap and the overlap rule. */
export async function POST(req: Request) {
  if (!(await requireParentApi(req))) return unauthorized()

  const parsed = CreateExtraClassSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  const data = parsed.data
  const day = data.day as DayOfWeek

  try {
    const count = await scheduleService.countEveningBlocks(DEFAULT_USER_ID, day)
    if (count >= MAX_EVENING_BLOCKS_PER_DAY) {
      return badRequest(`Tối đa ${MAX_EVENING_BLOCKS_PER_DAY} buổi học thêm mỗi ngày`)
    }

    const existing = await scheduleService.getEveningBlocks(DEFAULT_USER_ID, day)
    const overlaps = validatePeriodOverlap(
      { subjectId: data.subjectId, startTime: data.startTime, endTime: data.endTime },
      existing
    )
    if (overlaps) return badRequest('Khung giờ bị trùng với buổi học tối đã có')

    const id = await scheduleService.createPeriod({
      ...data,
      userId: DEFAULT_USER_ID,
      day,
      eventType: 'EXTRA_CLASS',
    })
    return ok({ id })
  } catch {
    return serverError('Failed to create extra class')
  }
}
