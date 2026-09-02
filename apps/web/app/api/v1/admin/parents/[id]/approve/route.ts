import { requireAdminApi } from '@/server/lib/api-auth'
import { approveParent } from '@/server/services/auth.service'
import { ok, serverError, unauthorized } from '@/app/api/v1/_lib/respond'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/** Activates an applicant and creates the student they applied with. */
export async function POST(req: Request, { params }: Params) {
  const admin = await requireAdminApi(req)
  if (!admin) return unauthorized()

  const { id } = await params
  try {
    await approveParent(admin.parentId, id)
    return ok({ approved: true })
  } catch (err) {
    return serverError(err instanceof Error ? err.message : 'Failed to approve account')
  }
}
