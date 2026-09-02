import { z } from 'zod'
import { requireAdminApi } from '@/server/lib/api-auth'
import { listParentsByStatus } from '@/server/services/auth.service'
import { badRequest, ok, serverError, unauthorized } from '@/app/api/v1/_lib/respond'

export const dynamic = 'force-dynamic'

const StatusSchema = z.enum(['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'])

/** The review queue. Defaults to the applicants nobody has decided on yet. */
export async function GET(req: Request) {
  if (!(await requireAdminApi(req))) return unauthorized()

  const raw = new URL(req.url).searchParams.get('status') ?? 'PENDING'
  const parsed = StatusSchema.safeParse(raw)
  if (!parsed.success) return badRequest('Unknown status')

  try {
    return ok(await listParentsByStatus(parsed.data))
  } catch {
    return serverError('Failed to list accounts')
  }
}
