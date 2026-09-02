import { NextResponse } from 'next/server'
import { getUserProgress } from '@/server/services/user.service'

import { guardStudentApp } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

export async function GET(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudentApp(req, studentId)
  if (denied) return denied

  try {
    const progress = await getUserProgress(studentId)
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
