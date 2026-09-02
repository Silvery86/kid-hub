import { CreatePeriodSchema, type DayOfWeek } from '@kid-hub/shared'
import * as scheduleService from '@/server/services/schedule.service'
import { validatePeriodOverlap } from '@/server/services/schedule.service'
import { badRequest, ok, serverError } from '@/app/api/v1/_lib/respond'

import { guardStudent } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

/** Creates a school period. Rejects a slot that overlaps one already on that day. */
export async function POST(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  const parsed = CreatePeriodSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  const data = parsed.data
  try {
    const existing = await scheduleService.getDaySchedule(studentId, data.day as DayOfWeek)
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
      studentId: studentId,
      day: data.day as DayOfWeek,
      eventType: 'SCHOOL_PERIOD',
    })
    return ok({ id })
  } catch {
    return serverError('Failed to create period')
  }
}
