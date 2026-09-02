import { z } from 'zod'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { requireParentApi } from '@/server/lib/api-auth'
import {
  addScreenTime,
  getScreenTimeLimit,
  getScreenTimeToday,
  setScreenTimeLimit,
} from '@/server/services/screen-time.service'
import { badRequest, ok, serverError, unauthorized } from '../_lib/respond'

export const dynamic = 'force-dynamic'

// Bounds mirror the web actions exactly: a tick is at most two minutes, and a
// daily limit runs from half an hour to eight.
const TickSchema = z.number().int().min(1).max(120)
const LimitSchema = z.number().int().min(30).max(480)

/** Today's usage against the configured limit. Parent-facing. */
export async function GET(req: Request) {
  if (!(await requireParentApi(req))) return unauthorized()
  try {
    const [usedSecs, limitMins] = await Promise.all([
      getScreenTimeToday(DEFAULT_USER_ID),
      getScreenTimeLimit(DEFAULT_USER_ID),
    ])
    return ok({ usedSecs, limitMins })
  } catch {
    return serverError('Failed to fetch screen time')
  }
}

/**
 * Records elapsed kid screen time. Unauthenticated on purpose, matching
 * addScreenTimeAction: the kid app reports its own usage, and the value is
 * clamped so a bad caller cannot inflate the counter meaningfully.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { seconds?: unknown } | null
  const parsed = TickSchema.safeParse(body?.seconds)
  if (!parsed.success) return badRequest('Invalid seconds value')

  try {
    await addScreenTime(DEFAULT_USER_ID, parsed.data)
    return ok({ recorded: true })
  } catch {
    return serverError('Failed to record screen time')
  }
}

/** Updates the daily limit in minutes. Parent-only. */
export async function PUT(req: Request) {
  if (!(await requireParentApi(req))) return unauthorized()

  const body = (await req.json().catch(() => null)) as { limitMins?: unknown } | null
  const parsed = LimitSchema.safeParse(body?.limitMins)
  if (!parsed.success) return badRequest('Limit must be between 30 and 480 minutes')

  try {
    await setScreenTimeLimit(DEFAULT_USER_ID, parsed.data)
    return ok({ saved: true })
  } catch {
    return serverError('Failed to update limit')
  }
}
