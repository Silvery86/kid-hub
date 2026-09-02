import { CreateExtraClassSchema, type DayOfWeek } from '@kid-hub/shared'
import { MAX_EVENING_BLOCKS_PER_DAY } from '@/lib/constants'
import * as scheduleService from '@/server/services/schedule.service'
import { validatePeriodOverlap } from '@/server/services/schedule.service'
import { badRequest, ok, serverError } from '@/app/api/v1/_lib/respond'

import { guardStudent } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

/** Creates a recurring evening class. Enforces the per-day cap and the overlap rule. */
export async function POST(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  const parsed = CreateExtraClassSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  const data = parsed.data
  const day = data.day as DayOfWeek

  try {
    const count = await scheduleService.countEveningBlocks(studentId, day)
    if (count >= MAX_EVENING_BLOCKS_PER_DAY) {
      return badRequest(`Tối đa ${MAX_EVENING_BLOCKS_PER_DAY} buổi học thêm mỗi ngày`)
    }

    const existing = await scheduleService.getEveningBlocks(studentId, day)
    const overlaps = validatePeriodOverlap(
      { subjectId: data.subjectId, startTime: data.startTime, endTime: data.endTime },
      existing
    )
    if (overlaps) return badRequest('Khung giờ bị trùng với buổi học tối đã có')

    const id = await scheduleService.createPeriod({
      ...data,
      studentId: studentId,
      day,
      eventType: 'EXTRA_CLASS',
    })
    return ok({ id })
  } catch {
    return serverError('Failed to create extra class')
  }
}
