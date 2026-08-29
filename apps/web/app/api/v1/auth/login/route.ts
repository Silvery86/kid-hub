import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { RateLimitResult } from '@/lib/rate-limit'
import { checkRateLimit, getLoginEmailRateLimiter, getLoginRateLimiter } from '@/lib/rate-limit'
import { loginWithParentPassword, createParentSession } from '@/server/services/auth.service'

export const dynamic = 'force-dynamic'

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
})

const tooManyAttempts = (rl: RateLimitResult) =>
  NextResponse.json(
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

export async function POST(req: Request) {
  // HTTP-layer rate limit by IP — the middleware limiter does not cover /api/*.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const rl = await checkRateLimit(getLoginRateLimiter(), ip)
  if (rl && !rl.success) return tooManyAttempts(rl)

  const parsed = LoginSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  // Second limit, keyed on the account rather than the caller, so one address behind
  // NAT cannot lock out the household and many addresses cannot grind one account.
  const emailRl = await checkRateLimit(getLoginEmailRateLimiter(), parsed.data.email)
  if (emailRl && !emailRl.success) return tooManyAttempts(emailRl)

  const result = await loginWithParentPassword(parsed.data.email, parsed.data.password)

  if (result.status === 'locked') {
    return NextResponse.json(
      { success: false, error: 'locked', lockoutSeconds: result.lockoutSeconds },
      { status: 429 },
    )
  }
  if (result.status !== 'ok') {
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
  }

  const { accessToken, refreshToken } = await createParentSession(result.userId)
  return NextResponse.json({ success: true, accessToken, refreshToken })
}
