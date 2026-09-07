import { NextResponse } from 'next/server'
import { RegisterSchema } from '@kid-hub/shared'
import { checkRateLimit, getRegisterRateLimiter } from '@/lib/rate-limit'
import { registerParent } from '@/server/services/auth.service'

export const dynamic = 'force-dynamic'

/**
 * Open signup. Deliberately returns NO tokens: the account is created PENDING
 * and cannot hold a session until an admin approves it, so the response says
 * only that the application was received.
 */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const rl = await checkRateLimit(getRegisterRateLimiter(), ip)
  if (rl && !rl.success) {
    return NextResponse.json(
      { success: false, error: 'Too many attempts' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } },
    )
  }

  const parsed = RegisterSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  try {
    const result = await registerParent(
      parsed.data.email,
      parsed.data.password,
      parsed.data.student,
    )
    return NextResponse.json({ success: true, data: { status: result.status } }, { status: 201 })
  } catch (err) {
    // A duplicate address is the applicant's own problem to fix, not a 500.
    if (err instanceof Error && err.message === 'Email already registered') {
      return NextResponse.json({ success: false, error: err.message }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: 'Failed to register' }, { status: 500 })
  }
}
