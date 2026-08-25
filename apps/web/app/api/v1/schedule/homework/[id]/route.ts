import { DEFAULT_USER_ID } from '@/lib/constants'
import { requireParentApi } from '@/server/lib/api-auth'
import * as scheduleService from '@/server/services/schedule.service'
import { badRequest, ok, serverError, unauthorized } from '../../../_lib/respond'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(req: Request, { params }: Params) {
  if (!(await requireParentApi(req))) return unauthorized()

  const { id } = await params
  if (!id) return badRequest('Invalid ID')

  try {
    await scheduleService.deleteDailyHomework(id, DEFAULT_USER_ID)
    return ok({ deleted: true })
  } catch {
    return serverError('Failed to delete homework')
  }
}
