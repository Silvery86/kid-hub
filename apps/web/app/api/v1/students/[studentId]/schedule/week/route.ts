import { NextResponse } from 'next/server'
import { getWeeklySchedule, getAllEveningBlocks } from '@/server/services/schedule.service'

import { guardStudentApp } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

/**
 * Mobile's counterpart to what the web schedule page reads through
 * getScheduleAction + getAllEveningBlocksAction. The day tabs need the whole
 * week, which GET /api/v1/schedule (TodayView) cannot supply.
 */
export async function GET(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudentApp(req, studentId)
  if (denied) return denied

  try {
    const [days, eveningBlocks] = await Promise.all([
      getWeeklySchedule(studentId),
      getAllEveningBlocks(studentId),
    ])
    return NextResponse.json({ success: true, data: { days, eveningBlocks } })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch schedule' }, { status: 500 })
  }
}
