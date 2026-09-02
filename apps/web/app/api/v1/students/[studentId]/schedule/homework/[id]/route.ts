import * as scheduleService from '@/server/services/schedule.service'
import { badRequest, ok, serverError } from '@/app/api/v1/_lib/respond'

import { guardStudent } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string; id: string }> }

export async function DELETE(req: Request, { params }: Params) {
  const { studentId, id } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  if (!id) return badRequest('Invalid ID')

  try {
    await scheduleService.deleteDailyHomework(id, studentId)
    return ok({ deleted: true })
  } catch {
    return serverError('Failed to delete homework')
  }
}
