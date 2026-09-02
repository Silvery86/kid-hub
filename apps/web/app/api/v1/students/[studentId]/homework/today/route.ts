import { NextResponse } from 'next/server'
import * as homeworkService from '@/server/services/homework.service'

import { guardStudentApp } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

export async function GET(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudentApp(req, studentId)
  if (denied) return denied

  try {
    const data = await homeworkService.getTodayHomework(
      studentId,
      homeworkService.todayDateKey(),
    )
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch homework' }, { status: 500 })
  }
}
