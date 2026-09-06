import { z } from 'zod'
import { requireParentApi } from '@/server/lib/api-auth'
import { createInvite } from '@/server/services/auth.service'
import { badRequest, forbidden, ok, serverError, unauthorized } from '@/app/api/v1/_lib/respond'

export const dynamic = 'force-dynamic'

const CreateInviteSchema = z.object({
  studentId: z.string().min(1),
  email: z.string().trim().toLowerCase().email().optional(),
})

/**
 * Raises an invite for a student. The code comes back exactly once — it is
 * stored only as a hash, so it cannot be shown again.
 */
export async function POST(req: Request) {
  const parent = await requireParentApi(req)
  if (!parent) return unauthorized()

  const parsed = CreateInviteSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return badRequest()

  try {
    const invite = await createInvite(parent.parentId, parsed.data.studentId, parsed.data.email)
    return ok(invite)
  } catch (err) {
    if (err instanceof Error && err.message === 'Forbidden') return forbidden()
    return serverError('Failed to create invite')
  }
}
