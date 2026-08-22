import { NextResponse } from 'next/server'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { getWeeklySchedule, getAllEveningBlocks } from '@/server/services/schedule.service'

export const dynamic = 'force-dynamic'

/**
 * Mobile's counterpart to what the web schedule page reads through
 * getScheduleAction + getAllEveningBlocksAction. The day tabs need the whole
 * week, which GET /api/v1/schedule (TodayView) cannot supply.
 */
export async function GET() {
  try {
    const [days, eveningBlocks] = await Promise.all([
      getWeeklySchedule(DEFAULT_USER_ID),
      getAllEveningBlocks(DEFAULT_USER_ID),
    ])
    return NextResponse.json({ success: true, data: { days, eveningBlocks } })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch schedule' }, { status: 500 })
  }
}
