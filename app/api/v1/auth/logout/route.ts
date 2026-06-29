import { NextResponse } from 'next/server'
import { z } from 'zod'
import { revokeRefreshToken } from '@/server/services/auth.service'

export const dynamic = 'force-dynamic'

const LogoutSchema = z.object({
  refreshToken: z.string().min(1),
})

export async function POST(req: Request) {
  const parsed = LogoutSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  try {
    await revokeRefreshToken(parsed.data.refreshToken)
  } catch {
    // revocation is best-effort; the token will expire naturally
  }
  return NextResponse.json({ success: true })
}
