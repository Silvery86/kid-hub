import { NextResponse } from 'next/server'
import { KidPatternSchema } from '@kid-hub/shared'
import { DEFAULT_PARENT_ID, DEFAULT_USER_ID } from '@/lib/constants'
import { checkRateLimit, getPinRateLimiter } from '@/lib/rate-limit'
import { getParentStatus, verifyKidUnlockPattern } from '@/server/services/auth.service'

export const dynamic = 'force-dynamic'

/**
 * Mobile's kid unlock gate.
 *
 * Unlike the web action this issues no session: mobile authenticates with the
 * Bearer token from parent login, and /api/v1/* is outside the middleware
 * matcher, so a kid pattern cannot gate API access there. It gates the UI. The
 * parts that must not live on the device — the pattern hash, the attempt count
 * and the lockout — stay here.
 */

/** Whether a pattern has been configured, so the screen can explain itself. */
export async function GET() {
  try {
    const { hasKidPatternSet } = await getParentStatus(DEFAULT_PARENT_ID, DEFAULT_USER_ID)
    return NextResponse.json({ success: true, data: { hasKidPatternSet } })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to read status' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // HTTP-layer rate limit by IP — the middleware limiter does not cover /api/*.
  // Shares the PIN limiter: both are short secrets guarding the same household.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const rl = await checkRateLimit(getPinRateLimiter(), ip)
  if (rl && !rl.success) {
    return NextResponse.json(
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

  const body = (await req.json().catch(() => null)) as { pattern?: unknown } | null
  const parsed = KidPatternSchema.safeParse(body?.pattern)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid unlock pattern' }, { status: 400 })
  }

  const result = await verifyKidUnlockPattern(DEFAULT_USER_ID, parsed.data)

  if (result.status === 'not-configured') {
    return NextResponse.json(
      { success: true, data: { status: 'not-configured' } },
      { status: 200 },
    )
  }
  if (result.status === 'locked') {
    return NextResponse.json(
      { success: true, data: { status: 'locked', lockoutSeconds: result.lockoutSeconds } },
      { status: 200 },
    )
  }
  if (result.status === 'wrong') {
    return NextResponse.json({ success: true, data: { status: 'wrong' } }, { status: 200 })
  }

  return NextResponse.json({ success: true, data: { status: 'ok' } })
}
