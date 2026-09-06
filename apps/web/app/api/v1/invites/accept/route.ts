import { z } from 'zod'
import { requireParentApi } from '@/server/lib/api-auth'
import { acceptInvite } from '@/server/services/auth.service'
import { badRequest, ok, serverError, unauthorized } from '@/app/api/v1/_lib/respond'

export const dynamic = 'force-dynamic'

const AcceptSchema = z.object({ code: z.string().trim().min(4).max(32) })

/** Redeems a code, linking the caller to the student as GUARDIAN. */
export async function POST(req: Request) {
  const parent = await requireParentApi(req)
  if (!parent) return unauthorized()

  const parsed = AcceptSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return badRequest()

  try {
    // Every outcome is a 200 with a status: the client renders all four the
    // same way, and an HTTP code per outcome would tell a guesser more.
    return ok(await acceptInvite(parent.parentId, parsed.data.code))
  } catch {
    return serverError('Failed to accept invite')
  }
}
