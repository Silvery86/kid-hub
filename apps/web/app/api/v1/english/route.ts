import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { SaveEnglishProgressSchema } from '@kid-hub/shared'
import { getGameSaveRateLimiter } from '@/lib/rate-limit'
import { saveEnglishSession } from '@/server/services/english.service'
import { getUserProgress } from '@/server/services/user.service'

export const dynamic = 'force-dynamic'

/** POST /api/v1/english — persist a completed English session (kid-facing, IP rate-limited). */
export async function POST(req: NextRequest) {
  // HTTP-layer rate limit by IP — the middleware limiter does not cover /api/*.
  const limiter = getGameSaveRateLimiter()
  if (limiter) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
    const { success, limit, remaining, reset } = await limiter.limit(ip)
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        }
      )
    }
  }

  try {
    const parsed = SaveEnglishProgressSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }
    const data = await saveEnglishSession(DEFAULT_USER_ID, parsed.data)
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to save session' }, { status: 500 })
  }
}

/** GET /api/v1/english — the household's English best scores as GameBestScore[]. */
export async function GET() {
  try {
    const progress = await getUserProgress(DEFAULT_USER_ID)
    const data = (progress?.bestScores ?? []).filter((s) => s.gameType === 'english')
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch best scores' }, { status: 500 })
  }
}
