import { NextResponse } from 'next/server'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { getUserById } from '@/server/services/user.service'

export const dynamic = 'force-dynamic'

/** Kid display profile — the dashboard greeting. Kid-facing, so no parent guard. */
export async function GET() {
  try {
    const user = await getUserById(DEFAULT_USER_ID)
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
