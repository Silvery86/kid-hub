import { fetchRecentActivity } from '@/server/services/activity.service'
import { ok, serverError } from '@/app/api/v1/_lib/respond'

import { guardStudent } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

/** The kid's recent activity, newest first. Parent-facing. */
export async function GET(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  const raw = Number(new URL(req.url).searchParams.get('limit'))
  const limit = Number.isInteger(raw) && raw > 0 ? Math.min(raw, MAX_LIMIT) : DEFAULT_LIMIT

  try {
    const rows = await fetchRecentActivity(studentId, limit)
    return ok(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })))
  } catch {
    return serverError('Failed to fetch activity')
  }
}
