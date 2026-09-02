import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { SaveMathProgressSchema } from '@kid-hub/shared'
import { checkRateLimit, getGameSaveRateLimiter } from '@/lib/rate-limit'
import { saveMathSession } from '@/server/services/math.service'
import { getUserProgress } from '@/server/services/user.service'

export const dynamic = 'force-dynamic'

/** POST /api/v1/math — persist a completed math session (kid-facing, IP rate-limited). */
export async function POST(req: NextRequest) {
  // HTTP-layer rate limit by IP — the middleware limiter does not cover /api/*.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const rl = await checkRateLimit(getGameSaveRateLimiter(), ip)
  if (rl && !rl.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset),
        },
      }
    )
  }

  try {
    const parsed = SaveMathProgressSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }
    const data = await saveMathSession(DEFAULT_USER_ID, parsed.data)
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to save session' }, { status: 500 })
  }
}

/** GET /api/v1/math — the household's math best scores as GameBestScore[]. */
export async function GET() {
  try {
    const progress = await getUserProgress(DEFAULT_USER_ID)
    const data = (progress?.bestScores ?? []).filter((s) => s.gameType === 'math')
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch best scores' }, { status: 500 })
  }
}
