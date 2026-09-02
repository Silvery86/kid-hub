import { z } from 'zod'
import { getKidAccessSettings, saveKidAccessSettings } from '@/server/services/user.service'
import { badRequest, ok, serverError } from '@/app/api/v1/_lib/respond'

import { guardStudent } from '@/app/api/v1/_lib/guard'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ studentId: string }> }

const SettingsSchema = z.record(z.string(), z.boolean())

/** Saved feature toggles. Null means the parent has not customised them yet. */
export async function GET(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  try {
    return ok(await getKidAccessSettings(studentId))
  } catch {
    return serverError('Failed to load settings')
  }
}

/** Replaces the whole toggle map, as the web action does — not a partial patch. */
export async function PUT(req: Request, { params }: Params) {
  const { studentId } = await params
  const denied = await guardStudent(req, studentId)
  if (denied) return denied

  const body = (await req.json().catch(() => null)) as { settings?: unknown } | null
  const parsed = SettingsSchema.safeParse(body?.settings)
  if (!parsed.success) return badRequest('Invalid settings format')

  try {
    await saveKidAccessSettings(studentId, parsed.data)
    return ok({ saved: true })
  } catch {
    return serverError('Failed to save settings')
  }
}
