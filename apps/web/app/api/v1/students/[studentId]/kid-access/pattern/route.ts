import { KidPatternSchema } from '@kid-hub/shared'
import { saveKidPattern } from '@/server/services/auth.service'
import { badRequest, ok, serverError } from '@/app/api/v1/_lib/respond'

import { guardStudent } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

/** Sets the kid unlock pattern. Parent-only — this is what the kid gate checks against. */
export async function PUT(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as { pattern?: unknown } | null
  const parsed = KidPatternSchema.safeParse(body?.pattern)
  if (!parsed.success) return badRequest('Invalid unlock pattern')

  try {
    await saveKidPattern(studentId, parsed.data)
    return ok({ saved: true })
  } catch {
    return serverError('Failed to save unlock pattern')
  }
}
