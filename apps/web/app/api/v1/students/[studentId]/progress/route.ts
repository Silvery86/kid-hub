import { NextResponse } from 'next/server'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { getUserProgress } from '@/server/services/user.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const progress = await getUserProgress(DEFAULT_USER_ID)
    if (!progress) {
      return NextResponse.json({ success: true, data: null })
    }

    const mathBestStars = progress.bestScores
      .filter((s) => s.gameType === 'math')
      .reduce((max, s) => Math.max(max, s.starsEarned), 0)

    const englishBestStars = progress.bestScores
      .filter((s) => s.gameType === 'english')
      .reduce((max, s) => Math.max(max, s.starsEarned), 0)

    return NextResponse.json({
      success: true,
      data: {
        totalPoints: progress.totalPoints,
        currentStreak: progress.currentStreak,
        lastActiveDate: progress.lastActiveDate,
        earnedBadgeIds: progress.earnedBadges.map((b) => b.badgeId),
        mathBestStars,
        englishBestStars,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch progress' }, { status: 500 })
  }
}
