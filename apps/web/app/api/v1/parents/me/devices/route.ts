import { requireParentApi } from '@/server/lib/api-auth'
import { listDevices } from '@/server/services/auth.service'
import { ok, serverError, unauthorized } from '@/app/api/v1/_lib/respond'

export const dynamic = 'force-dynamic'

/** The parent's live sessions, one row per signed-in device. */
export async function GET(req: Request) {
  const parent = await requireParentApi(req)
  if (!parent) return unauthorized()

  try {
    return ok(await listDevices(parent.parentId))
  } catch {
    return serverError('Failed to list devices')
  }
}
