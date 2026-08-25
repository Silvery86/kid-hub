import { z } from 'zod'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { requireParentApi } from '@/server/lib/api-auth'
import { getKidAccessSettings, saveKidAccessSettings } from '@/server/services/user.service'
import { badRequest, ok, serverError, unauthorized } from '../_lib/respond'

export const dynamic = 'force-dynamic'

const SettingsSchema = z.record(z.string(), z.boolean())

/** Saved feature toggles. Null means the parent has not customised them yet. */
export async function GET(req: Request) {
  if (!(await requireParentApi(req))) return unauthorized()
  try {
    return ok(await getKidAccessSettings(DEFAULT_USER_ID))
  } catch {
    return serverError('Failed to load settings')
  }
}

/** Replaces the whole toggle map, as the web action does — not a partial patch. */
export async function PUT(req: Request) {
  if (!(await requireParentApi(req))) return unauthorized()

  const body = (await req.json().catch(() => null)) as { settings?: unknown } | null
  const parsed = SettingsSchema.safeParse(body?.settings)
  if (!parsed.success) return badRequest('Invalid settings format')

  try {
    await saveKidAccessSettings(DEFAULT_USER_ID, parsed.data)
    return ok({ saved: true })
  } catch {
    return serverError('Failed to save settings')
  }
}
