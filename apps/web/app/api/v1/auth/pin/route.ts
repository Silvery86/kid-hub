import { ParentPinSchema } from '@kid-hub/shared'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { checkRateLimit, getPinRateLimiter } from '@/lib/rate-limit'
import { requireParentApi } from '@/server/lib/api-auth'
import { verifyPin } from '@/server/services/auth.service'
import { badRequest, ok, serverError, unauthorized } from '../../_lib/respond'

export const dynamic = 'force-dynamic'

/**
 * Parent PIN check — the second factor in front of the management screens.
 *
 * Unlike verifyPinAction this mints no session: the caller already holds a
 * parent access token from /auth/login, so the PIN gates the parent UI rather
 * than granting access. Requiring the Bearer token here means an unauthenticated
 * caller cannot use this route to brute-force the PIN.
 *
 * Outcomes come back as data, not HTTP errors — the screen renders all of them.
 */
export async function POST(req: Request) {
  if (!(await requireParentApi(req))) return unauthorized()

  // Same limiter the web Server Action path uses in middleware.ts.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const rl = await checkRateLimit(getPinRateLimiter(), ip)
  if (rl && !rl.success) {
    return Response.json(
      { success: false, error: 'Too many attempts' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset),
          'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)),
        },
      },
    )
  }

  const body = (await req.json().catch(() => null)) as { pin?: unknown } | null
  const parsed = ParentPinSchema.safeParse(body?.pin)
  if (!parsed.success) return badRequest('Invalid PIN')

  try {
    const result = await verifyPin(DEFAULT_USER_ID, parsed.data)
    if (result.status === 'locked') {
      return ok({ status: 'locked' as const, lockoutSeconds: result.lockoutSeconds })
    }
    return ok({ status: result.status })
  } catch {
    return serverError('PIN verification failed')
  }
}
