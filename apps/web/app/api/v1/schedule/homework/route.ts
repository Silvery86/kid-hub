import { AddDailyHomeworkSchema } from '@kid-hub/shared'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { requireParentApi } from '@/server/lib/api-auth'
import * as scheduleService from '@/server/services/schedule.service'
import { badRequest, ok, serverError, unauthorized } from '../../_lib/respond'

export const dynamic = 'force-dynamic'

/** Assigns a one-off homework item for a date. Parent-only. */
export async function POST(req: Request) {
  if (!(await requireParentApi(req))) return unauthorized()

  const parsed = AddDailyHomeworkSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  try {
    const id = await scheduleService.createDailyHomework({
      ...parsed.data,
      userId: DEFAULT_USER_ID,
    })
    return ok({ id })
  } catch {
    return serverError('Failed to add homework')
  }
}
