import { z } from 'zod'
import { requireAdminApi } from '@/server/lib/api-auth'
import { rejectParent } from '@/server/services/auth.service'
import { badRequest, ok, serverError, unauthorized } from '@/app/api/v1/_lib/respond'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

const NoteSchema = z.object({ note: z.string().trim().max(200).optional() })

/** Refuses an applicant. The note is shown to them at their next login attempt. */
export async function POST(req: Request, { params }: Params) {
  const admin = await requireAdminApi(req)
  if (!admin) return unauthorized()

  const { id } = await params
  const parsed = NoteSchema.safeParse((await req.json().catch(() => ({}))) ?? {})
  if (!parsed.success) return badRequest('Note must be 200 characters or fewer')

  try {
    await rejectParent(admin.parentId, id, parsed.data.note)
    return ok({ rejected: true })
  } catch (err) {
    return serverError(err instanceof Error ? err.message : 'Failed to reject account')
  }
}
