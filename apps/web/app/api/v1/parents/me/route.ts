import { requireParentApi } from '@/server/lib/api-auth'
import { getParentProfile, listStudentsForParent } from '@/server/services/auth.service'
import { ok, serverError, unauthorized } from '@/app/api/v1/_lib/respond'

export const dynamic = 'force-dynamic'

/** The signed-in parent plus the students they are linked to. */
export async function GET(req: Request) {
  const parent = await requireParentApi(req)
  if (!parent) return unauthorized()

  try {
    const [profile, students] = await Promise.all([
      getParentProfile(parent.parentId),
      listStudentsForParent(parent.parentId),
    ])
    if (!profile) return unauthorized()
    return ok({ ...profile, students })
  } catch {
    return serverError('Failed to load account')
  }
}
