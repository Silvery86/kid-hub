import 'server-only'
import type { NextRequest } from 'next/server'
import { verifyParentAccessToken } from '@/server/services/auth.service'

/**
 * API counterpart of requireParentSession: reads a Bearer token instead of a cookie.
 * Throws 'Unauthorized' so the route handler can return a 401 JSON response.
 */
export const requireParentApi = async (req: NextRequest): Promise<{ userId: string }> => {
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new Error('Unauthorized')

  const session = await verifyParentAccessToken(token)
  if (!session) throw new Error('Unauthorized')
  return { userId: session.userId }
}
