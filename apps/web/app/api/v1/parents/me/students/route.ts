import { z } from 'zod'
import { requireParentApi } from '@/server/lib/api-auth'
import { createStudent, listStudentsForParent } from '@/server/services/auth.service'
import { badRequest, ok, serverError, unauthorized } from '@/app/api/v1/_lib/respond'

export const dynamic = 'force-dynamic'

const CreateStudentSchema = z.object({
  name: z.string().trim().min(1).max(60),
  gradeLevel: z.number().int().min(1).max(12),
})

/** The students this parent may act for. Drives the student switcher. */
export async function GET(req: Request) {
  const parent = await requireParentApi(req)
  if (!parent) return unauthorized()

  try {
    return ok(await listStudentsForParent(parent.parentId))
  } catch {
    return serverError('Failed to list students')
  }
}

/** Adds a student to this parent's household, linked as OWNER. */
export async function POST(req: Request) {
  const parent = await requireParentApi(req)
  if (!parent) return unauthorized()

  const parsed = CreateStudentSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  try {
    const student = await createStudent(parent.parentId, parsed.data.name, parsed.data.gradeLevel)
    return ok(student)
  } catch {
    return serverError('Failed to create student')
  }
}
