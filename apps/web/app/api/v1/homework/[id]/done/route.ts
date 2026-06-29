import { NextResponse } from 'next/server'
import { DEFAULT_USER_ID } from '@/lib/constants'
import * as homeworkService from '@/server/services/homework.service'
import { addUserPoints, updateStreak } from '@/server/services/progress.service'
import { recordActivity } from '@/server/services/activity.service'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: periodId } = await params
  try {
    await homeworkService.markDone(periodId, DEFAULT_USER_ID, homeworkService.todayDateKey())
    await updateStreak(DEFAULT_USER_ID)
    await addUserPoints(DEFAULT_USER_ID, 10)
    void recordActivity(DEFAULT_USER_ID, 'HOMEWORK_DONE', 'Bài tập hôm nay', '📝')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to mark homework done' }, { status: 500 })
  }
}
