import { z } from 'zod'
import { requireAdminApi } from '@/server/lib/api-auth'
import { suspendParent } from '@/server/services/auth.service'
import { badRequest, ok, serverError, unauthorized } from '@/app/api/v1/_lib/respond'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

const NoteSchema = z.object({ note: z.string().trim().max(200).optional() })

/**
 * Disables an approved account and drops its devices immediately, rather than
 * letting them keep working until their access token expires.
 */
export async function POST(req: Request, { params }: Params) {
  const admin = await requireAdminApi(req)
  if (!admin) return unauthorized()

  const { id } = await params
  const parsed = NoteSchema.safeParse((await req.json().catch(() => ({}))) ?? {})
  if (!parsed.success) return badRequest('Note must be 200 characters or fewer')

  try {
    await suspendParent(admin.parentId, id, parsed.data.note)
    return ok({ suspended: true })
  } catch (err) {
    return serverError(err instanceof Error ? err.message : 'Failed to suspend account')
  }
}
