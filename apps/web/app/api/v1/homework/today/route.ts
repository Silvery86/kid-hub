import { NextResponse } from 'next/server'
import { DEFAULT_USER_ID } from '@/lib/constants'
import * as homeworkService from '@/server/services/homework.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await homeworkService.getTodayHomework(
      DEFAULT_USER_ID,
      'monday',
      homeworkService.todayDateKey(),
    )
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch homework' }, { status: 500 })
  }
}
