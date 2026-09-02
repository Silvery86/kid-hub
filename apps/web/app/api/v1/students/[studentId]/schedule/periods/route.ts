import { CreatePeriodSchema, type DayOfWeek } from '@kid-hub/shared'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { requireParentApi } from '@/server/lib/api-auth'
import * as scheduleService from '@/server/services/schedule.service'
import { validatePeriodOverlap } from '@/server/services/schedule.service'
import { badRequest, ok, serverError, unauthorized } from '../../_lib/respond'

export const dynamic = 'force-dynamic'

/** Creates a school period. Rejects a slot that overlaps one already on that day. */
export async function POST(req: Request) {
  if (!(await requireParentApi(req))) return unauthorized()

  const parsed = CreatePeriodSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  const data = parsed.data
  try {
    const existing = await scheduleService.getDaySchedule(DEFAULT_USER_ID, data.day as DayOfWeek)
    const overlaps =
      existing != null &&
      validatePeriodOverlap(
        {
          periodNumber: data.periodNumber,
          subjectId: data.subjectId,
          startTime: data.startTime,
          endTime: data.endTime,
        },
        existing.periods
      )
    if (overlaps) return badRequest('This time slot overlaps with an existing period')

    const id = await scheduleService.createPeriod({
      ...data,
      studentId: DEFAULT_USER_ID,
      day: data.day as DayOfWeek,
      eventType: 'SCHOOL_PERIOD',
    })
    return ok({ id })
  } catch {
    return serverError('Failed to create period')
  }
}
