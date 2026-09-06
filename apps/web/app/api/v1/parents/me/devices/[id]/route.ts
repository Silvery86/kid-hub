import { requireParentApi } from '@/server/lib/api-auth'
import { revokeDevice } from '@/server/services/auth.service'
import { forbidden, ok, serverError, unauthorized } from '@/app/api/v1/_lib/respond'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/**
 * Signs out one device. The ownership check is a WHERE clause in the repository,
 * so a row id alone cannot sign out somebody else's session.
 */
export async function DELETE(req: Request, { params }: Params) {
  const parent = await requireParentApi(req)
  if (!parent) return unauthorized()

  const { id } = await params
  try {
    const revoked = await revokeDevice(parent.parentId, id)
    return revoked ? ok({ revoked: true }) : forbidden()
  } catch {
    return serverError('Failed to revoke device')
  }
}
