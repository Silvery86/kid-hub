import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validateRefreshToken, createParentSession } from '@/server/services/auth.service'

export const dynamic = 'force-dynamic'

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export async function POST(req: Request) {
  const parsed = RefreshSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  const userId = await validateRefreshToken(parsed.data.refreshToken)
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired refresh token' },
      { status: 401 },
    )
  }

  const { accessToken, refreshToken } = await createParentSession(userId)
  return NextResponse.json({ success: true, accessToken, refreshToken })
}
