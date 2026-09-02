import { z } from 'zod'
import {
  addScreenTime,
  getScreenTimeLimit,
  getScreenTimeToday,
  setScreenTimeLimit,
} from '@/server/services/screen-time.service'
import { badRequest, ok, serverError } from '@/app/api/v1/_lib/respond'

import { guardStudent, guardStudentApp } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

// Bounds mirror the web actions exactly: a tick is at most two minutes, and a
// daily limit runs from half an hour to eight.
const TickSchema = z.number().int().min(1).max(120)
const LimitSchema = z.number().int().min(30).max(480)

/** Today's usage against the configured limit. Parent-facing. */
export async function GET(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  try {
    const [usedSecs, limitMins] = await Promise.all([
      getScreenTimeToday(studentId),
      getScreenTimeLimit(studentId),
    ])
    return ok({ usedSecs, limitMins })
  } catch {
    return serverError('Failed to fetch screen time')
  }
}

/**
 * Records elapsed kid screen time. Reachable from a kid session as well as the
 * parent's, since the kid app reports its own usage; the value stays clamped so
 * a bad caller cannot inflate the counter meaningfully.
 */
export async function POST(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudentApp(req, studentId)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as { seconds?: unknown } | null
  const parsed = TickSchema.safeParse(body?.seconds)
  if (!parsed.success) return badRequest('Invalid seconds value')

  try {
    await addScreenTime(studentId, parsed.data)
    return ok({ recorded: true })
  } catch {
    return serverError('Failed to record screen time')
  }
}

/** Updates the daily limit in minutes. Parent-only. */
export async function PUT(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as { limitMins?: unknown } | null
  const parsed = LimitSchema.safeParse(body?.limitMins)
  if (!parsed.success) return badRequest('Limit must be between 30 and 480 minutes')

  try {
    await setScreenTimeLimit(studentId, parsed.data)
    return ok({ saved: true })
  } catch {
    return serverError('Failed to update limit')
  }
}
