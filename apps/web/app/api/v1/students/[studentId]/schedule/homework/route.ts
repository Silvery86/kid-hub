import { AddDailyHomeworkSchema } from '@kid-hub/shared'
import * as scheduleService from '@/server/services/schedule.service'
import { badRequest, ok, serverError } from '@/app/api/v1/_lib/respond'

import { guardStudent } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

/** Assigns a one-off homework item for a date. Parent-only. */
export async function POST(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  const parsed = AddDailyHomeworkSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  try {
    const id = await scheduleService.createDailyHomework({
      ...parsed.data,
      studentId: studentId,
    })
    return ok({ id })
  } catch {
    return serverError('Failed to add homework')
  }
}
