import { NextResponse } from 'next/server'
import { DEFAULT_USER_ID } from '@/lib/constants'
import {
  jsDateToDayOfWeek,
  buildTodayView,
  getDaySchedule,
  getEveningBlocks,
  getOverridesForDate,
  getDailyHomework,
} from '@/server/services/schedule.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const today = new Date()
    const date = today.toISOString().split('T')[0]!
    const dow = jsDateToDayOfWeek(today)

    const [schoolResult, eveningBlocks, cancelledIds, homework] = await Promise.all([
      dow ? getDaySchedule(DEFAULT_USER_ID, dow) : Promise.resolve(null),
      dow ? getEveningBlocks(DEFAULT_USER_ID, dow) : Promise.resolve([]),
      getOverridesForDate(DEFAULT_USER_ID, date),
      getDailyHomework(DEFAULT_USER_ID, date),
    ])

    const data = buildTodayView(
      date,
      schoolResult?.periods ?? [],
      eveningBlocks,
      cancelledIds,
      homework,
    )
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch schedule' }, { status: 500 })
  }
}
