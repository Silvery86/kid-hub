import { NextResponse } from 'next/server'
import { z } from 'zod'
import { loginWithParentPassword, createParentSession } from '@/server/services/auth.service'

export const dynamic = 'force-dynamic'

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
})

export async function POST(req: Request) {
  const parsed = LoginSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

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
