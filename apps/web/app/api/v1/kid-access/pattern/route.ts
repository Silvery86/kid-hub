import { KidPatternSchema } from '@kid-hub/shared'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { requireParentApi } from '@/server/lib/api-auth'
import { saveKidPattern } from '@/server/services/auth.service'
import { badRequest, ok, serverError, unauthorized } from '../../_lib/respond'

export const dynamic = 'force-dynamic'

/** Sets the kid unlock pattern. Parent-only — this is what the kid gate checks against. */
export async function PUT(req: Request) {
  if (!(await requireParentApi(req))) return unauthorized()

  const body = (await req.json().catch(() => null)) as { pattern?: unknown } | null
  const parsed = KidPatternSchema.safeParse(body?.pattern)
  if (!parsed.success) return badRequest('Invalid unlock pattern')

  try {
    await saveKidPattern(DEFAULT_USER_ID, parsed.data)
    return ok({ saved: true })
  } catch {
    return serverError('Failed to save unlock pattern')
  }
}
