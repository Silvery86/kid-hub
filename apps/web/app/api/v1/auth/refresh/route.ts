import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  revokeRefreshToken,
  validateRefreshToken,
  createParentSession,
} from '@/server/services/auth.service'

export const dynamic = 'force-dynamic'

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export async function POST(req: Request) {
  const parsed = RefreshSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  const validated = await validateRefreshToken(parsed.data.refreshToken)
  if (!validated) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired refresh token' },
      { status: 401 },
    )
  }

  // Rotation: the old device row is revoked and a new one takes its place, so a
  // replayed refresh token is rejected rather than silently accepted.
  await revokeRefreshToken(parsed.data.refreshToken)
  const { accessToken, refreshToken } = await createParentSession(validated.parentId)
  return NextResponse.json({ success: true, accessToken, refreshToken })
}
