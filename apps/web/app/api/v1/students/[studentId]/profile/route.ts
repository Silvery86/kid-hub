import { NextResponse } from 'next/server'
import { getUserById } from '@/server/services/user.service'

import { guardStudentApp } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

/** Kid display profile — the dashboard greeting. Kid-facing, so no parent guard. */
export async function GET(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudentApp(req, studentId)
  if (denied) return denied

  try {
    const user = await getUserById(studentId)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }
    return NextResponse.json({
      success: true,
      data: { name: user.name, gradeLevel: user.gradeLevel },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 })
  }
}
