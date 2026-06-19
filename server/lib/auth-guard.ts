'server-only'

import { cookies } from 'next/headers'
import {
  PARENT_ACCESS_COOKIE,
  PARENT_REFRESH_COOKIE,
  verifyParentAccessToken,
  verifyParentRefreshToken,
  compareStoredTokenHash,
  createParentAccessToken,
  createParentRefreshToken,
  hashTokenForStorage,
} from '@/server/services/auth.service'
import * as userRepo from '@/server/repositories/user.repository'
import { PARENT_ACCESS_TTL_SECONDS, PARENT_REFRESH_TTL_SECONDS } from '@/lib/constants'

const issueParentSessionCookies = async (userId: string): Promise<void> => {
  const accessToken = await createParentAccessToken(userId)
  const refreshToken = await createParentRefreshToken(userId)
  const refreshHash = await hashTokenForStorage(refreshToken)
  const refreshExpiresAt = new Date(Date.now() + PARENT_REFRESH_TTL_SECONDS * 1000)

  await userRepo.saveRefreshToken(userId, refreshHash, refreshExpiresAt)

  const cookieStore = await cookies()
  cookieStore.set(PARENT_ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PARENT_ACCESS_TTL_SECONDS,
    path: '/',
  })
  cookieStore.set(PARENT_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PARENT_REFRESH_TTL_SECONDS,
    path: '/',
  })
}

/**
 * Verifies the parent session using the access token, falling back to refresh token rotation.
 * Throws 'Unauthorized' if no valid session exists.
 */
export const requireParentSession = async (): Promise<{ userId: string }> => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(PARENT_ACCESS_COOKIE)?.value

  if (accessToken) {
    const accessSession = await verifyParentAccessToken(accessToken)
    if (accessSession) return { userId: accessSession.userId }
  }

  const refreshToken = cookieStore.get(PARENT_REFRESH_COOKIE)?.value
  if (!refreshToken) throw new Error('Unauthorized')

  const refreshSession = await verifyParentRefreshToken(refreshToken)
  if (!refreshSession) throw new Error('Unauthorized')

  const record = await userRepo.getParentAuthRecord(refreshSession.userId)
  if (!record?.refreshTokenHash || !record.refreshTokenExpiresAt) throw new Error('Unauthorized')
  if (record.refreshTokenExpiresAt.getTime() <= Date.now()) throw new Error('Unauthorized')

  const validRefresh = await compareStoredTokenHash(refreshToken, record.refreshTokenHash)
  if (!validRefresh) throw new Error('Unauthorized')

  await issueParentSessionCookies(refreshSession.userId)
  return { userId: refreshSession.userId }
}
