import { NextResponse } from 'next/server'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { getReportCard, buildReportCard } from '@/server/services/grades.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const grades = await getReportCard(DEFAULT_USER_ID)
    return NextResponse.json({ success: true, data: buildReportCard(DEFAULT_USER_ID, grades) })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch grades' }, { status: 500 })
  }
}
