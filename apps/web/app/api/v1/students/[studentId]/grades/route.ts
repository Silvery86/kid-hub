import { NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateBadge } from '@kid-hub/shared'
import { getReportCard, buildReportCard, upsertGrade } from '@/server/services/grades.service'
import { badRequest, ok, serverError } from '@/app/api/v1/_lib/respond'

import { guardStudent, guardStudentApp } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

export async function GET(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudentApp(req, studentId)
  if (denied) return denied

  try {
    const grades = await getReportCard(studentId)
    return NextResponse.json({ success: true, data: buildReportCard(studentId, grades) })
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
export async function PUT(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  const parsed = UpsertGradeSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  try {
    // The tier is derived, never taken from the caller.
    const badge = calculateBadge(parsed.data.score)
    await upsertGrade(studentId, { ...parsed.data, badge })
    return ok({ saved: true })
  } catch {
    return serverError('Failed to save grade')
  }
}
