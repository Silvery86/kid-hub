import { NextResponse } from 'next/server'
import {
  jsDateToDayOfWeek,
  buildTodayView,
  getDaySchedule,
  getEveningBlocks,
  getOverridesForDate,
  getDailyHomework,
  getBellSchedule,
} from '@/server/services/schedule.service'

import { guardStudentApp } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

export async function GET(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudentApp(req, studentId)
  if (denied) return denied

  try {
    const today = new Date()
    const date = today.toISOString().split('T')[0]!
    const dow = jsDateToDayOfWeek(today)

    const [schoolResult, eveningBlocks, cancelledIds, homework, bell] = await Promise.all([
      dow ? getDaySchedule(studentId, dow) : Promise.resolve(null),
      dow ? getEveningBlocks(studentId, dow) : Promise.resolve([]),
      getOverridesForDate(studentId, date),
      getDailyHomework(studentId, date),
      getBellSchedule(studentId),
    ])

    const todayBellSlots = (bell?.slots ?? []).filter(
      (slot) => slot.kind !== 'PERIOD' && (!dow || slot.days.includes(dow)),
    )

    const data = buildTodayView(
      date,
      schoolResult?.periods ?? [],
      eveningBlocks,
      cancelledIds,
      homework,
      todayBellSlots,
    )
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch schedule' }, { status: 500 })
  }
}
