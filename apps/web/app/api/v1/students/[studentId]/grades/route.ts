import { NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateBadge } from '@kid-hub/shared'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { requireParentApi } from '@/server/lib/api-auth'
import { getReportCard, buildReportCard, upsertGrade } from '@/server/services/grades.service'
import { badRequest, ok, serverError, unauthorized } from '../_lib/respond'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const grades = await getReportCard(DEFAULT_USER_ID)
    return NextResponse.json({ success: true, data: buildReportCard(DEFAULT_USER_ID, grades) })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch grades' }, { status: 500 })
  }
}

// Mirrors UpsertGradeSchema in grades.actions.ts.
const UpsertGradeSchema = z.object({
  subjectId: z.string().min(1),
  score: z.number().min(0).max(10),
  semester: z.union([z.literal(1), z.literal(2)]),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/),
})

/** Records one subject's score for a semester. Parent-only. */
export async function PUT(req: Request) {
  if (!(await requireParentApi(req))) return unauthorized()

  const parsed = UpsertGradeSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  try {
    // The tier is derived, never taken from the caller.
    const badge = calculateBadge(parsed.data.score)
    await upsertGrade(DEFAULT_USER_ID, { ...parsed.data, badge })
    return ok({ saved: true })
  } catch {
    return serverError('Failed to save grade')
  }
}
