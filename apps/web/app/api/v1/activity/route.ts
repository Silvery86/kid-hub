import { DEFAULT_USER_ID } from '@/lib/constants'
import { requireParentApi } from '@/server/lib/api-auth'
import { fetchRecentActivity } from '@/server/services/activity.service'
import { ok, serverError, unauthorized } from '../_lib/respond'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

/** The kid's recent activity, newest first. Parent-facing. */
export async function GET(req: Request) {
  if (!(await requireParentApi(req))) return unauthorized()

  const raw = Number(new URL(req.url).searchParams.get('limit'))
  const limit = Number.isInteger(raw) && raw > 0 ? Math.min(raw, MAX_LIMIT) : DEFAULT_LIMIT

  try {
    const rows = await fetchRecentActivity(DEFAULT_USER_ID, limit)
    return ok(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })))
  } catch {
    return serverError('Failed to fetch activity')
  }
}
