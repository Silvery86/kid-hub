import { NextResponse } from 'next/server'
import { getWeekSchedule, getAllEveningBlocks } from '@/server/services/schedule.service'
import { WeekStartSchema, weekStartOfToday } from '@kid-hub/shared'

import { guardStudentApp } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

/**
 * Mobile's counterpart to what the web schedule page reads through
 * getScheduleAction + getAllEveningBlocksAction. The day tabs need the whole
 * week, which GET /api/v1/schedule (TodayView) cannot supply.
 *
 * `?week=YYYY-MM-DD` selects a week (Phase 6); without it the current one is
 * returned, so a mobile build that has never heard of weeks keeps working.
 */
export async function GET(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudentApp(req, studentId)
  if (denied) return denied

  const requested = new URL(req.url).searchParams.get('week')
  const parsedWeek = WeekStartSchema.safeParse(requested ?? weekStartOfToday())
  if (!parsedWeek.success) {
    return NextResponse.json({ success: false, error: 'Invalid week' }, { status: 400 })
  }

  try {
    const [week, eveningBlocks] = await Promise.all([
      getWeekSchedule(studentId, parsedWeek.data),
      getAllEveningBlocks(studentId),
    ])
    return NextResponse.json({
      success: true,
      data: {
        days: week.days,
        eveningBlocks,
        weekStartDate: week.weekStartDate,
        source: week.source,
        ...(week.inheritedFrom ? { inheritedFrom: week.inheritedFrom } : {}),
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch schedule' }, { status: 500 })
  }
}
