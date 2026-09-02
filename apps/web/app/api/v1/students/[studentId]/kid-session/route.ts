import { NextResponse } from 'next/server'
import { KidPatternSchema } from '@kid-hub/shared'
import { checkRateLimit, getPinRateLimiter } from '@/lib/rate-limit'
import { createKidSessionToken, verifyKidUnlockPattern } from '@/server/services/auth.service'
import * as studentRepo from '@/server/repositories/student.repository'
import { guardStudent } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

/**
 * Kid unlock, scoped to one student.
 *
 * The parent authenticates the device; the child then enters the pattern and the
 * device receives a kid token that reaches only this student's data. The parts
 * that must not live on the device — the pattern hash, the attempt count and the
 * lockout — stay here.
 */

/** Whether a pattern has been configured, so the screen can explain itself. */
export async function GET(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  try {
    const record = await studentRepo.getKidPatternRecord(studentId)
    return NextResponse.json({
      success: true,
      data: { hasKidPatternSet: Boolean(record?.kidPatternHash) },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to read status' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  // Rate limit per student, not per IP: this stops an attacker burning another
  // household's pattern attempts from many addresses.
  const rl = await checkRateLimit(getPinRateLimiter(), `kid-session:${studentId}`)
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

  const result = await verifyKidUnlockPattern(studentId, parsed.data)

  if (result.status === 'not-configured') {
    return NextResponse.json({ success: true, data: { status: 'not-configured' } })
  }
  if (result.status === 'locked') {
    return NextResponse.json({
      success: true,
      data: { status: 'locked', lockoutSeconds: result.lockoutSeconds },
    })
  }
  if (result.status === 'wrong') {
    return NextResponse.json({ success: true, data: { status: 'wrong' } })
  }

  // The pattern held: hand back a token scoped to this student alone, which the
  // kid screens send instead of the parent's. It reaches no parent endpoint.
  const kidToken = await createKidSessionToken(studentId)
  return NextResponse.json({ success: true, data: { status: 'ok', kidToken } })
}
