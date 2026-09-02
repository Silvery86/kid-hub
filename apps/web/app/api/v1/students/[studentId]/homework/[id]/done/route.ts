import { NextResponse } from 'next/server'
import * as homeworkService from '@/server/services/homework.service'
import { addUserPoints, updateStreak } from '@/server/services/progress.service'
import { recordActivity } from '@/server/services/activity.service'

import { guardStudentApp } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ studentId: string; id: string }> },
) {
  const { studentId, id: periodId } = await params
  const denied = await guardStudentApp(req, studentId)
  if (denied) return denied

  try {
    await homeworkService.markDone(periodId, studentId, homeworkService.todayDateKey())
    await updateStreak(studentId)
    await addUserPoints(studentId, 10)
    void recordActivity(studentId, 'HOMEWORK_DONE', 'Bài tập hôm nay', '📝')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to mark homework done' }, { status: 500 })
  }
}
