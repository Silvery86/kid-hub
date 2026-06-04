import 'server-only'

import { cookies } from 'next/headers'
import { verifySessionToken, SESSION_COOKIE } from '@/server/services/auth.service'

/** Throws 'Unauthorized' if the request has no valid parent session cookie. */
export const requireParentSession = async (): Promise<void> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) throw new Error('Unauthorized')
  const session = await verifySessionToken(token)
  if (!session) throw new Error('Unauthorized')
}
